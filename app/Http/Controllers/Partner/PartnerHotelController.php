<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateHotelRequest;
use App\Models\Hotel;
use App\Models\HotelImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PartnerHotelController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Hotel::query()->where('user_id', auth()->id());

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(name) LIKE ?', ['%'.strtolower($search).'%'])
                    ->orWhereRaw('LOWER(city) LIKE ?', ['%'.strtolower($search).'%'])
                    ->orWhereRaw('LOWER(country) LIKE ?', ['%'.strtolower($search).'%']);
            });
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $hotels = $query->with('images')->paginate(10)->withQueryString();

        return Inertia::render('partner/hotels/index', [
            'hotels'  => $hotels,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? 'all',
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('partner/hotels/create');
    }

    public function store(UpdateHotelRequest $request): RedirectResponse
    {
        $hotel = Hotel::create(array_merge($request->only([
            'name', 'address', 'city', 'country', 'star_rating',
            'phone', 'email', 'description', 'status',
        ]), ['user_id' => auth()->id()]));

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $order => $image) {
                $path = $image->store('hotels', 'public');
                HotelImage::create([
                    'hotel_id' => $hotel->id,
                    'path'     => $path,
                    'order'    => $order,
                ]);
            }
        }

        return redirect()->route('partner.hotels.index')
            ->with('success', 'Hotel created successfully.');
    }

    public function edit(Hotel $hotel): Response
    {
        abort_if($hotel->user_id !== auth()->id(), 403);

        return Inertia::render('partner/hotels/edit', [
            'hotel' => $hotel->load('images'),
        ]);
    }

    public function update(UpdateHotelRequest $request, Hotel $hotel): RedirectResponse
    {
        abort_if($hotel->user_id !== auth()->id(), 403);

        $hotel->update($request->only([
            'name', 'address', 'city', 'country', 'star_rating',
            'phone', 'email', 'description', 'status',
        ]));

        // Delete requested images
        if ($request->delete_images) {
            foreach ($request->delete_images as $imageId) {
                $img = HotelImage::where('id', $imageId)->where('hotel_id', $hotel->id)->first();
                if ($img) {
                    Storage::disk('public')->delete($img->path);
                    $img->delete();
                }
            }
        }

        // Store new images
        if ($request->hasFile('images')) {
            $maxOrder = $hotel->images()->max('order') ?? -1;
            foreach ($request->file('images') as $i => $image) {
                $path = $image->store('hotels', 'public');
                HotelImage::create([
                    'hotel_id' => $hotel->id,
                    'path'     => $path,
                    'order'    => $maxOrder + 1 + $i,
                ]);
            }
        }

        return redirect()->route('partner.hotels.index')
            ->with('success', 'Hotel updated successfully.');
    }

    public function destroy(Hotel $hotel): RedirectResponse
    {
        abort_if($hotel->user_id !== auth()->id(), 403);

        $hotel->delete();

        return redirect()->route('partner.hotels.index')
            ->with('success', 'Hotel deleted successfully.');
    }
}
