<?php

namespace App\Http\Controllers\Partner;

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
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PartnerRoomController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Room::whereHas('hotel', fn ($q) => $q->where('user_id', auth()->id()));

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(name) LIKE ?', ['%'.strtolower($search).'%'])
                    ->orWhereRaw('LOWER(type) LIKE ?', ['%'.strtolower($search).'%']);
            });
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->hotel && $request->hotel !== 'all') {
            $query->where('hotel_id', $request->hotel);
        }

        $rooms = $query->with(['hotel', 'images', 'priceRules'])
            ->join('hotels', 'rooms.hotel_id', '=', 'hotels.id')
            ->select('rooms.*', 'hotels.name as hotel_name')
            ->paginate(10)->withQueryString();

        $pageStart = ($rooms->currentPage() - 1) * $rooms->perPage();
        $rooms->getCollection()->transform(function ($room, $index) use ($pageStart) {
            $pricing = RoomPricing::resolve($room);
            return [
                'id'                => $room->id,
                'hotel_id'          => $room->hotel_id,
                'hotel_name'        => $room->hotel_name,
                'name'              => $room->name,
                'type'              => $room->type,
                'capacity'          => $room->capacity,
                'price_per_night'   => $room->price_per_night,
                'effective_price'   => $pricing['effective_price'],
                'active_price_rule' => $pricing['applied_rule']?->name,
                'status'            => $room->status,
                'serial'            => $pageStart + $index + 1,
                'images'            => $room->images->map(fn ($img) => ['id' => $img->id, 'path' => $img->path, 'order' => $img->order])->toArray(),
            ];
        });

        $hotels = Hotel::where('user_id', auth()->id())->orderBy('name')->get(['id', 'name']);

        return Inertia::render('partner/rooms/index', [
            'rooms'   => $rooms,
            'hotels'  => $hotels,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? 'all',
                'hotel'  => $request->hotel ?? 'all',
            ],
        ]);
    }

    public function create(): Response
    {
        $hotels = Hotel::where('user_id', auth()->id())->get(['id', 'name']);

        return Inertia::render('partner/rooms/create', [
            'hotels' => $hotels,
        ]);
    }

    public function store(StoreRoomRequest $request): RedirectResponse
    {
        $hotel = Hotel::findOrFail($request->hotel_id);
        abort_if($hotel->user_id !== auth()->id(), 403);

        DB::transaction(function () use ($request, $hotel) {
            $room = Room::create([
                'hotel_id'        => $hotel->id,
                'name'            => $request->name,
                'type'            => $request->type,
                'capacity'        => $request->capacity,
                'price_per_night' => $request->price_per_night,
                'status'          => $request->status,
            ]);

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $order => $image) {
                    $path = $image->store('rooms', 'public');
                    RoomImage::create(['room_id' => $room->id, 'path' => $path, 'order' => $order]);
                }
            }

            $this->syncPriceRules($request, $room);
        });

        return redirect()->route('partner.rooms.index')
            ->with('success', 'Room created successfully.');
    }

    public function edit(Room $room): Response
    {
        abort_if($room->hotel->user_id !== auth()->id(), 403);

        $room->load(['hotel', 'images', 'priceRules']);

        $hotels = Hotel::where('user_id', auth()->id())->get(['id', 'name']);
        $pricing = RoomPricing::resolve($room);

        return Inertia::render('partner/rooms/edit', [
            'room'   => [
                'id'                => $room->id,
                'hotel_id'          => $room->hotel_id,
                'name'              => $room->name,
                'type'              => $room->type,
                'capacity'          => $room->capacity,
                'price_per_night'   => $room->price_per_night,
                'status'            => $room->status,
                'effective_price'   => $pricing['effective_price'],
                'active_price_rule' => $pricing['applied_rule']?->name,
                'images'            => $room->images->map(fn ($img) => [
                    'id'    => $img->id,
                    'path'  => $img->path,
                    'order' => $img->order,
                ])->values()->all(),
                'price_rules'       => $room->priceRules->map(fn ($rule) => [
                    'id'               => $rule->id,
                    'name'             => $rule->name,
                    'season_type'      => $rule->season_type,
                    'start_date'       => $rule->start_date?->format('Y-m-d'),
                    'end_date'         => $rule->end_date?->format('Y-m-d'),
                    'days_of_week'     => $rule->days_of_week ?? [],
                    'adjustment_type'  => $rule->adjustment_type,
                    'adjustment_value' => (string) $rule->adjustment_value,
                    'priority'         => $rule->priority,
                    'is_active'        => $rule->is_active,
                    'is_stackable'     => $rule->is_stackable,
                ])->values()->all(),
            ],
            'hotels' => $hotels,
        ]);
    }

    public function update(UpdateRoomRequest $request, Room $room): RedirectResponse
    {
        abort_if($room->hotel->user_id !== auth()->id(), 403);

        if ((int) $request->hotel_id !== $room->hotel_id) {
            $newHotel = Hotel::findOrFail($request->hotel_id);
            abort_if($newHotel->user_id !== auth()->id(), 403);
        }

        DB::transaction(function () use ($request, $room) {
            $room->update([
                'hotel_id'        => $request->hotel_id,
                'name'            => $request->name,
                'type'            => $request->type,
                'capacity'        => $request->capacity,
                'price_per_night' => $request->price_per_night,
                'status'          => $request->status,
            ]);

            if ($request->delete_images) {
                foreach ($request->delete_images as $imageId) {
                    $img = RoomImage::where('id', $imageId)->where('room_id', $room->id)->first();
                    if ($img) {
                        Storage::disk('public')->delete($img->path);
                        $img->delete();
                    }
                }
            }

            if ($request->hasFile('images')) {
                $maxOrder = $room->images()->max('order') ?? -1;
                foreach ($request->file('images') as $i => $image) {
                    $path = $image->store('rooms', 'public');
                    RoomImage::create(['room_id' => $room->id, 'path' => $path, 'order' => $maxOrder + 1 + $i]);
                }
            }

            $this->syncPriceRules($request, $room);
        });

        return redirect()->route('partner.rooms.index')
            ->with('success', 'Room updated successfully.');
    }

    public function destroy(Room $room): RedirectResponse
    {
        abort_if($room->hotel->user_id !== auth()->id(), 403);

        $room->delete();

        return redirect()->route('partner.rooms.index')
            ->with('success', 'Room deleted successfully.');
    }

    public function images(Room $room): Response
    {
        abort_if($room->hotel->user_id !== auth()->id(), 403);

        $room->load(['images' => fn ($q) => $q->orderBy('order'), 'hotel']);

        return Inertia::render('partner/rooms/images', [
            'room' => [
                'id'         => $room->id,
                'name'       => $room->name,
                'type'       => $room->type,
                'hotel_id'   => $room->hotel_id,
                'hotel_name' => $room->hotel->name ?? '',
                'images'     => $room->images->map(fn ($img) => ['id' => $img->id, 'path' => $img->path, 'order' => $img->order])->toArray(),
            ],
        ]);
    }

    public function updateImages(Request $request, Room $room)
    {
        abort_if($room->hotel->user_id !== auth()->id(), 403);

        $request->validate([
            'images'          => 'nullable|array',
            'images.*'        => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            'delete_images'   => 'nullable|array',
            'delete_images.*' => 'integer|exists:room_images,id',
            'reorder'         => 'nullable|array',
        ]);

        try {
            DB::transaction(function () use ($request, $room) {
                if ($request->delete_images) {
                    foreach ($request->delete_images as $imageId) {
                        $img = RoomImage::where('id', $imageId)->where('room_id', $room->id)->first();
                        if ($img) {
                            Storage::disk('public')->delete($img->path);
                            $img->delete();
                        }
                    }
                }

                if ($request->hasFile('images')) {
                    $maxOrder = $room->images()->max('order') ?? -1;
                    foreach ($request->file('images') as $i => $image) {
                        $path = $image->store('rooms', 'public');
                        RoomImage::create(['room_id' => $room->id, 'path' => $path, 'order' => $maxOrder + 1 + $i]);
                    }
                }

                if ($request->reorder) {
                    foreach ($request->reorder as $index => $imageId) {
                        RoomImage::where('id', $imageId)->where('room_id', $room->id)->update(['order' => $index]);
                    }
                }
            });

            return back()->with('success', 'Images updated successfully.');
        } catch (Exception $e) {
            return back()->with('error', 'Failed to update images.');
        }
    }

    private function syncPriceRules(Request $request, Room $room): void
    {
        $incoming = collect($request->input('price_rules', []))
            ->filter(fn ($rule) => filled($rule['name'] ?? null));

        $incomingIds = $incoming->pluck('id')->filter()->values();

        $room->priceRules()->whereNotIn('id', $incomingIds)->delete();

        foreach ($incoming as $rule) {
            $payload = [
                'name'             => $rule['name'],
                'season_type'      => $rule['season_type'] ?? null,
                'start_date'       => $rule['start_date'] ?? null,
                'end_date'         => $rule['end_date'] ?? null,
                'days_of_week'     => ! empty($rule['days_of_week']) ? array_values(array_map('intval', $rule['days_of_week'])) : null,
                'adjustment_type'  => $rule['adjustment_type'],
                'adjustment_value' => $rule['adjustment_value'],
                'priority'         => max((int) ($rule['priority'] ?? 1), 1),
                'is_active'        => filter_var($rule['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
                'is_stackable'     => filter_var($rule['is_stackable'] ?? false, FILTER_VALIDATE_BOOLEAN),
            ];

            if (!empty($rule['id'])) {
                $room->priceRules()->where('id', $rule['id'])->update($payload);
            } else {
                $room->priceRules()->create($payload);
            }
        }
    }
}
