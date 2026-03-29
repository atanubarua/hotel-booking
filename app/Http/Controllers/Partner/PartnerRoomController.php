<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoomRequest;
use App\Http\Requests\UpdateRoomRequest;
use App\Models\Hotel;
use App\Models\Room;
use App\Models\RoomImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

        $rooms = $query->with(['hotel', 'images'])->paginate(10)->withQueryString();

        return Inertia::render('partner/rooms/index', [
            'rooms'   => $rooms,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? 'all',
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

        return redirect()->route('partner.rooms.index')
            ->with('success', 'Room created successfully.');
    }

    public function edit(Room $room): Response
    {
        abort_if($room->hotel->user_id !== auth()->id(), 403);

        $hotels = Hotel::where('user_id', auth()->id())->get(['id', 'name']);

        return Inertia::render('partner/rooms/edit', [
            'room'   => $room->load(['hotel', 'images']),
            'hotels' => $hotels,
        ]);
    }

    public function update(UpdateRoomRequest $request, Room $room): RedirectResponse
    {
        abort_if($room->hotel->user_id !== auth()->id(), 403);

        if ($request->hotel_id !== $room->hotel_id) {
            $newHotel = Hotel::findOrFail($request->hotel_id);
            abort_if($newHotel->user_id !== auth()->id(), 403);
        }

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
}
