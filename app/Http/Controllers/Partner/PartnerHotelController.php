<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateHotelRequest;
use App\Models\Hotel;
use App\Models\HotelImage;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        $hotels = $query->withCount('rooms')->with(['images' => fn ($q) => $q->orderBy('order')->limit(1)])->paginate(10)->withQueryString();

        $pageStart = ($hotels->currentPage() - 1) * $hotels->perPage();
        $hotels->getCollection()->transform(function ($hotel, $index) use ($pageStart) {
            return [
                'id'         => $hotel->id,
                'name'       => $hotel->name,
                'address'    => $hotel->address,
                'city'       => $hotel->city,
                'country'    => $hotel->country,
                'star_rating'=> $hotel->star_rating,
                'phone'      => $hotel->phone,
                'email'      => $hotel->email,
                'description'=> $hotel->description,
                'status'     => $hotel->status,
                'rooms_count'=> $hotel->rooms_count,
                'serial'     => $pageStart + $index + 1,
                'images'     => $hotel->images->map(fn ($img) => ['id' => $img->id, 'path' => $img->path, 'order' => $img->order])->values()->all(),
            ];
        });

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
                HotelImage::create(['hotel_id' => $hotel->id, 'path' => $path, 'order' => $order]);
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

        if ($request->delete_images) {
            foreach ($request->delete_images as $imageId) {
                $img = HotelImage::where('id', $imageId)->where('hotel_id', $hotel->id)->first();
                if ($img) {
                    Storage::disk('public')->delete($img->path);
                    $img->delete();
                }
            }
        }

        if ($request->hasFile('images')) {
            $maxOrder = $hotel->images()->max('order') ?? -1;
            foreach ($request->file('images') as $i => $image) {
                $path = $image->store('hotels', 'public');
                HotelImage::create(['hotel_id' => $hotel->id, 'path' => $path, 'order' => $maxOrder + 1 + $i]);
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

    public function images(Hotel $hotel): Response
    {
        abort_if($hotel->user_id !== auth()->id(), 403);

        $hotel->load(['images' => fn ($q) => $q->orderBy('order')]);

        return Inertia::render('partner/hotels/images', [
            'hotel' => [
                'id'      => $hotel->id,
                'name'    => $hotel->name,
                'city'    => $hotel->city,
                'country' => $hotel->country,
                'images'  => $hotel->images->map(fn ($img) => ['id' => $img->id, 'path' => $img->path, 'order' => $img->order])->toArray(),
            ],
        ]);
    }

    public function updateImages(Request $request, Hotel $hotel)
    {
        abort_if($hotel->user_id !== auth()->id(), 403);

        $request->validate([
            'images'          => 'nullable|array',
            'images.*'        => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            'delete_images'   => 'nullable|array',
            'delete_images.*' => 'integer|exists:hotel_images,id',
            'reorder'         => 'nullable|array',
        ]);

        try {
            DB::transaction(function () use ($request, $hotel) {
                if ($request->delete_images) {
                    foreach ($request->delete_images as $imageId) {
                        $img = HotelImage::where('id', $imageId)->where('hotel_id', $hotel->id)->first();
                        if ($img) {
                            Storage::disk('public')->delete($img->path);
                            $img->delete();
                        }
                    }
                }

                if ($request->hasFile('images')) {
                    $maxOrder = $hotel->images()->max('order') ?? -1;
                    foreach ($request->file('images') as $i => $image) {
                        $path = $image->store('hotels', 'public');
                        HotelImage::create(['hotel_id' => $hotel->id, 'path' => $path, 'order' => $maxOrder + 1 + $i]);
                    }
                }

                if ($request->reorder) {
                    foreach ($request->reorder as $index => $imageId) {
                        HotelImage::where('id', $imageId)->where('hotel_id', $hotel->id)->update(['order' => $index]);
                    }
                }
            });

            return back()->with('success', 'Images updated successfully.');
        } catch (Exception $e) {
            return back()->with('error', 'Failed to update images.');
        }
    }
}
