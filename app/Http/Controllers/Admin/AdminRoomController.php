<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoomRequest;
use App\Http\Requests\UpdateRoomRequest;
use App\Models\Hotel;
use App\Models\HotelImage;
use App\Models\Room;
use App\Models\RoomImage;
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
            ->with(['hotel', 'images'])
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
            return [
                'id' => $room->id,
                'hotel_id' => $room->hotel_id,
                'hotel_name' => $room->hotel_name,
                'name' => $room->name,
                'type' => $room->type,
                'capacity' => $room->capacity,
                'price_per_night' => $room->price_per_night,
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

    public function store(StoreRoomRequest $request): RedirectResponse
    {
        $hotel = Hotel::findOrFail($request->hotel_id);

        $room = Room::create([
            'hotel_id'        => $request->hotel_id,
            'name'            => $request->name,
            'type'            => $request->type,
            'capacity'        => $request->capacity,
            'price_per_night' => $request->price_per_night,
            'status'          => $request->status,
        ]);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $order => $image) {
                $path = $image->store('rooms', 'public');
                RoomImage::create([
                    'room_id' => $room->id,
                    'path'    => $path,
                    'order'   => $order,
                ]);
            }
        }

        return redirect()->route('admin.rooms.index')
            ->with('success', 'Room created successfully.');
    }

    public function update(UpdateRoomRequest $request, Room $room): RedirectResponse
    {
        $room->update([
            'hotel_id'        => $request->hotel_id,
            'name'            => $request->name,
            'type'            => $request->type,
            'capacity'        => $request->capacity,
            'price_per_night' => $request->price_per_night,
            'status'          => $request->status,
        ]);

        // Delete requested images
        if ($request->delete_images) {
            foreach ($request->delete_images as $imageId) {
                $img = RoomImage::where('id', $imageId)->where('room_id', $room->id)->first();
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
}
