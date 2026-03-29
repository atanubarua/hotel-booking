<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoomRequest;
use App\Http\Requests\UpdateRoomRequest;
use App\Models\Hotel;
use App\Models\Room;
use App\Models\RoomImage;
use App\Support\RoomPricing;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AdminRoomController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Room::query()
            ->with(['hotel', 'images', 'priceRules'])
            ->join('hotels', 'rooms.hotel_id', '=', 'hotels.id')
            ->select('rooms.*', 'hotels.name as hotel_name');

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(rooms.name) LIKE ?', ['%'.strtolower($search).'%'])
                    ->orWhereRaw('LOWER(rooms.type) LIKE ?', ['%'.strtolower($search).'%'])
                    ->orWhereRaw('LOWER(hotels.name) LIKE ?', ['%'.strtolower($search).'%']);
            });
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('rooms.status', $request->status);
        }

        if ($request->hotel && $request->hotel !== 'all') {
            $query->where('rooms.hotel_id', $request->hotel);
        }

        $rooms = $query->paginate(15)->withQueryString();

        // Transform room data for the frontend
        $pageStart = ($rooms->currentPage() - 1) * $rooms->perPage();
        $rooms->getCollection()->transform(function ($room, $index) use ($pageStart) {
            $pricing = RoomPricing::resolve($room);

            return [
                'id' => $room->id,
                'hotel_id' => $room->hotel_id,
                'hotel_name' => $room->hotel_name,
                'name' => $room->name,
                'type' => $room->type,
                'capacity' => $room->capacity,
                'price_per_night' => $room->price_per_night,
                'effective_price' => $pricing['effective_price'],
                'active_price_rule' => $pricing['applied_rule']?->name,
                'status' => $room->status,
                'created_at' => $room->created_at,
                'serial' => $pageStart + $index + 1,
                'images' => $room->images->map(function($image) {
                    return [
                        'id' => $image->id,
                        'path' => $image->path,
                        'order' => $image->order,
                    ];
                })->toArray(),
            ];
        });

        $hotels = Hotel::orderBy('name')->get(['id', 'name']);

        return Inertia::render('admin/rooms/index', [
            'rooms'   => $rooms,
            'hotels'  => $hotels,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? 'all',
                'hotel'  => $request->hotel ?? 'all',
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $hotels = Hotel::orderBy('name')->get(['id', 'name']);

        return Inertia::render('admin/rooms/create', [
            'hotels' => $hotels,
            'selectedHotelId' => $request->integer('hotel') ?: null,
        ]);
    }

    public function store(StoreRoomRequest $request): RedirectResponse
    {
        $room = DB::transaction(function () use ($request) {
            $room = Room::create($this->roomPayload($request));

            $this->syncImages($request, $room);
            $this->syncPriceRules($request, $room);

            return $room;
        });

        return redirect()->route('admin.rooms.index')
            ->with('success', 'Room created successfully.');
    }

    public function edit(Room $room): Response
    {
        $room->load(['hotel', 'images', 'priceRules']);

        $hotels = Hotel::orderBy('name')->get(['id', 'name']);

        return Inertia::render('admin/rooms/edit', [
            'room' => $this->transformRoomForForm($room),
            'hotels' => $hotels,
        ]);
    }

    public function update(UpdateRoomRequest $request, Room $room): RedirectResponse
    {
        DB::transaction(function () use ($request, $room) {
            $room->update($this->roomPayload($request));

            $this->syncImages($request, $room);
            $this->syncPriceRules($request, $room);
        });

        return redirect()->route('admin.rooms.index')
            ->with('success', 'Room updated successfully.');
    }

    public function destroy(Room $room): RedirectResponse
    {
        // Images cascade-deleted by DB foreign key
        $room->delete();

        return redirect()->route('admin.rooms.index')
            ->with('success', 'Room deleted successfully.');
    }

    public function images(Room $room): Response
    {
        $room->load(['images' => function ($q) {
            $q->orderBy('order');
        }, 'hotel']);

        $transformedRoom = [
            'id' => $room->id,
            'name' => $room->name,
            'type' => $room->type,
            'hotel_id' => $room->hotel_id,
            'hotel_name' => $room->hotel->name ?? '',
            'images' => $room->images->map(function($image) {
                return [
                    'id' => $image->id,
                    'path' => $image->path,
                    'order' => $image->order,
                ];
            })->toArray(),
        ];

        return Inertia::render('admin/rooms/images', [
            'room' => $transformedRoom,
        ]);
    }

    public function updateImages(Request $request, Room $room)
    {
        // Log what's being received for debugging
        Log::info('Update room images request received', [
            'room_id' => $room->id,
            'has_files' => $request->hasFile('images'),
            'file_count' => $request->hasFile('images') ? count($request->file('images')) : 0,
            'delete_images' => $request->input('delete_images'),
            'reorder' => $request->input('reorder'),
        ]);

        $request->validate([
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            'delete_images' => 'nullable|array',
            'delete_images.*' => 'integer|exists:room_images,id',
            'reorder' => 'nullable|array',
        ]);

        try {
            DB::transaction(function () use ($request, $room) {
                // Delete requested images
                if ($request->delete_images) {
                    foreach ($request->delete_images as $imageId) {
                        $img = RoomImage::where('id', $imageId)
                            ->where('room_id', $room->id)
                            ->first();
                        if ($img) {
                            Storage::disk('public')->delete($img->path);
                            $img->delete();
                        }
                    }
                }

                // Store new images
                if ($request->hasFile('images')) {
                    $maxOrder = $room->images()->max('order') ?? -1;
                    foreach ($request->file('images') as $i => $image) {
                        $path = $image->store('rooms', 'public');
                        RoomImage::create([
                            'room_id' => $room->id,
                            'path'    => $path,
                            'order'   => $maxOrder + 1 + $i,
                        ]);
                    }
                }

                // Reorder images
                if ($request->reorder) {
                    foreach ($request->reorder as $index => $imageId) {
                        RoomImage::where('id', $imageId)
                            ->where('room_id', $room->id)
                            ->update(['order' => $index]);
                    }
                }
            });

            return back()->with('success', 'Room images updated successfully.');
        } catch (Exception $e) {
            return back()->with('error', 'Failed to update images. Please try again.');
        }
    }

    private function roomPayload(Request $request): array
    {
        return [
            'hotel_id' => $request->integer('hotel_id'),
            'name' => $request->string('name')->toString(),
            'type' => $request->string('type')->toString(),
            'capacity' => $request->integer('capacity'),
            'price_per_night' => $request->input('price_per_night'),
            'status' => $request->string('status')->toString(),
        ];
    }

    private function syncImages(Request $request, Room $room): void
    {
        if ($request->delete_images) {
            foreach ($request->delete_images as $imageId) {
                $img = RoomImage::where('id', $imageId)->where('room_id', $room->id)->first();
                if ($img) {
                    Storage::disk('public')->delete($img->path);
                    $img->delete();
                }
            }
        }

        if (! $request->hasFile('images')) {
            return;
        }

        $maxOrder = $room->images()->max('order') ?? -1;

        foreach ($request->file('images') as $i => $image) {
            $path = $image->store('rooms', 'public');
            RoomImage::create([
                'room_id' => $room->id,
                'path' => $path,
                'order' => $maxOrder + 1 + $i,
            ]);
        }
    }

    private function syncPriceRules(Request $request, Room $room): void
    {
        $rules = collect($request->input('price_rules', []))
            ->filter(fn ($rule) => filled($rule['name'] ?? null))
            ->map(function ($rule) {
                return [
                    'name' => $rule['name'],
                    'start_date' => $rule['start_date'],
                    'end_date' => $rule['end_date'],
                    'adjustment_type' => $rule['adjustment_type'],
                    'adjustment_value' => $rule['adjustment_value'],
                    'priority' => max((int) ($rule['priority'] ?? 1), 1),
                    'is_active' => filter_var($rule['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
                ];
            })
            ->values();

        $room->priceRules()->delete();

        if ($rules->isEmpty()) {
            return;
        }

        $room->priceRules()->createMany($rules->all());
    }

    private function transformRoomForForm(Room $room): array
    {
        $pricing = RoomPricing::resolve($room);

        return [
            'id' => $room->id,
            'hotel_id' => $room->hotel_id,
            'name' => $room->name,
            'type' => $room->type,
            'capacity' => $room->capacity,
            'price_per_night' => $room->price_per_night,
            'status' => $room->status,
            'effective_price' => $pricing['effective_price'],
            'active_price_rule' => $pricing['applied_rule']?->name,
            'images' => $room->images->map(fn ($image) => [
                'id' => $image->id,
                'path' => $image->path,
                'order' => $image->order,
            ])->values()->all(),
            'price_rules' => $room->priceRules->map(fn ($rule) => [
                'name' => $rule->name,
                'start_date' => $rule->start_date->format('Y-m-d'),
                'end_date' => $rule->end_date->format('Y-m-d'),
                'adjustment_type' => $rule->adjustment_type,
                'adjustment_value' => (string) $rule->adjustment_value,
                'priority' => $rule->priority,
                'is_active' => $rule->is_active,
            ])->values()->all(),
        ];
    }
}
