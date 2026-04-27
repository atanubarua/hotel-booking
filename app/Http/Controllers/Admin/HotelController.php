<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreHotelRequest;
use App\Http\Requests\UpdateHotelRequest;
use App\Jobs\HotelRegistrationJob;
use App\Models\Amenity;
use App\Models\Hotel;
use App\Models\HotelImage;
use App\Models\User;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class HotelController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Hotel::query()
            ->select([
                'hotels.id',
                'hotels.name',
                'hotels.city',
                'hotels.country',
                'hotels.star_rating',
                'hotels.phone',
                'hotels.email',
                'hotels.description',
                'hotels.status',
                'hotels.created_at',
                'users.name as partner_name',
                DB::raw('(SELECT COUNT(*) FROM rooms WHERE rooms.hotel_id = hotels.id) as room_count'),
            ])
            ->with(['images' => function ($q) {
                $q->select('hotel_id', 'id', 'path', 'order')
                  ->orderBy('order');
            }])
            ->join('users', 'hotels.user_id', '=', 'users.id');

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(hotels.name) LIKE ?', ['%'.strtolower($search).'%'])
                    ->orWhereRaw('LOWER(hotels.city) LIKE ?', ['%'.strtolower($search).'%'])
                    ->orWhereRaw('LOWER(hotels.country) LIKE ?', ['%'.strtolower($search).'%'])
                    ->orWhereRaw('LOWER(users.name) LIKE ?', ['%'.strtolower($search).'%']);
            });
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('hotels.status', $request->status);
        }

        if ($request->partner) {
            $query->where('hotels.user_id', $request->partner);
        }

        $hotels = $query->paginate(15)->withQueryString();

        // Transform hotels to include images (only first image for list view)
        $pageStart = ($hotels->currentPage() - 1) * $hotels->perPage();
        $transformedHotels = $hotels->getCollection()->map(function ($hotel, $index) use ($pageStart) {
            // Get the first image only for list view performance
            $firstImage = $hotel->images->first();

            return [
                'id' => $hotel->id,
                'name' => $hotel->name,
                'address' => $hotel->address,
                'city' => $hotel->city,
                'country' => $hotel->country,
                'starRating' => $hotel->star_rating,
                'phone' => $hotel->phone,
                'email' => $hotel->email,
                'description' => $hotel->description,
                'partnerName' => $hotel->partner_name,
                'roomCount' => $hotel->room_count,
                'status' => $hotel->status,
                'createdAt' => $hotel->created_at->toIso8601String(),
                'serial' => $pageStart + $index + 1,
                'images' => $firstImage ? [
                    [
                        'id' => $firstImage->id,
                        'path' => $firstImage->path,
                        'order' => $firstImage->order,
                    ]
                ] : [],
            ];
        });

        $hotels->setCollection($transformedHotels);

        return Inertia::render('admin/hotels/index', [
            'hotels'  => $hotels,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? 'all',
                'partner'=> $request->partner ?? null,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/hotels/create', [
            'amenities' => Amenity::orderBy('name')->get(['id', 'name', 'icon']),
        ]);
    }

    public function store(StoreHotelRequest $request): RedirectResponse
    {
        try {
            [$partner, $hotel] = DB::transaction(function () use ($request) {
                $partner = User::create([
                    'name'     => $request->partner_name,
                    'email'    => $request->partner_email,
                    'password' => Hash::make(Str::random(16)),
                    'role'     => Role::Partner,
                ]);

                $hotel = Hotel::create([
                    'user_id'                     => $partner->id,
                    'name'                        => $request->name,
                    'address'                     => $request->address,
                    'city'                        => $request->city,
                    'country'                     => $request->country,
                    'star_rating'                 => $request->star_rating,
                    'phone'                       => $request->phone,
                    'email'                       => $request->email,
                    'description'                 => $request->description,
                    'status'                      => $request->status,
                    'cancellation_deadline_hours' => $request->cancellation_deadline_hours ?? 48,
                    'cancellation_refund_percent' => $request->cancellation_refund_percent ?? 100,
                ]);

                if ($request->filled('amenities')) {
                    $hotel->amenities()->sync($request->input('amenities'));
                }

                return [$partner, $hotel];
            });

            // Store uploaded images
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

            HotelRegistrationJob::dispatch($partner, $hotel);

            return redirect()->route('admin.hotels.index')
                ->with('success', 'Hotel and partner account created successfully.');
        } catch (Exception $e) {
            return back()->withErrors(['general' => 'Something went wrong. Please try again.']);
        }
    }

    public function edit(Hotel $hotel): Response
    {
        $hotel->load(['partner', 'images', 'amenities']);

        // Transform the hotel data to match the AdminHotel TypeScript type
        $transformedHotel = [
            'id' => $hotel->id,
            'name' => $hotel->name,
            'address' => $hotel->address,
            'city' => $hotel->city,
            'country' => $hotel->country,
            'starRating' => $hotel->star_rating,
            'phone' => $hotel->phone,
            'email' => $hotel->email,
            'description' => $hotel->description,
            'partnerName' => $hotel->partner->name ?? '',
            'partnerEmail' => $hotel->partner->email ?? '',
            'roomCount' => $hotel->rooms->count(),
            'status' => $hotel->status,
            'cancellationDeadlineHours' => $hotel->cancellation_deadline_hours ?? 48,
            'cancellationRefundPercent' => $hotel->cancellation_refund_percent ?? 100,
            'createdAt' => $hotel->created_at->toIso8601String(),
            'images' => $hotel->images->map(function($image) {
                return [
                    'id' => $image->id,
                    'path' => $image->path,
                    'order' => $image->order,
                ];
            })->toArray(),
            'amenity_ids' => $hotel->amenities->pluck('id')->toArray(),
        ];

        return Inertia::render('admin/hotels/edit', [
            'hotel'     => $transformedHotel,
            'amenities' => Amenity::orderBy('name')->get(['id', 'name', 'icon']),
        ]);
    }

    public function images(Hotel $hotel): Response
    {
        $hotel->load(['images' => function ($q) {
            $q->orderBy('order');
        }]);

        $transformedHotel = [
            'id' => $hotel->id,
            'name' => $hotel->name,
            'city' => $hotel->city,
            'country' => $hotel->country,
            'images' => $hotel->images->map(function($image) {
                return [
                    'id' => $image->id,
                    'path' => $image->path,
                    'order' => $image->order,
                ];
            })->toArray(),
        ];

        return Inertia::render('admin/hotels/images', [
            'hotel' => $transformedHotel,
        ]);
    }

    public function updateImages(Request $request, Hotel $hotel)
    {
        // Log what's being received for debugging
        \Log::info('Update images request received', [
            'hotel_id' => $hotel->id,
            'has_files' => $request->hasFile('images'),
            'file_count' => $request->hasFile('images') ? count($request->file('images')) : 0,
            'delete_images' => $request->input('delete_images'),
            'reorder' => $request->input('reorder'),
        ]);

        $request->validate([
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            'delete_images' => 'nullable|array',
            'delete_images.*' => 'integer|exists:hotel_images,id',
            'reorder' => 'nullable|array',
        ]);

        try {
            DB::transaction(function () use ($request, $hotel) {
                // Delete requested images
                if ($request->delete_images) {
                    foreach ($request->delete_images as $imageId) {
                        $img = HotelImage::where('id', $imageId)
                            ->where('hotel_id', $hotel->id)
                            ->first();
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

                // Reorder images
                if ($request->reorder) {
                    foreach ($request->reorder as $index => $imageId) {
                        HotelImage::where('id', $imageId)
                            ->where('hotel_id', $hotel->id)
                            ->update(['order' => $index]);
                    }
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Hotel images updated successfully.',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update images. Please try again.',
            ], 500);
        }
    }

    public function update(UpdateHotelRequest $request, Hotel $hotel): RedirectResponse
    {
        $hotel->update([
            'name'                        => $request->name,
            'address'                     => $request->address,
            'city'                        => $request->city,
            'country'                     => $request->country,
            'star_rating'                 => $request->star_rating,
            'phone'                       => $request->phone,
            'email'                       => $request->email,
            'description'                 => $request->description,
            'status'                      => $request->status,
            'cancellation_deadline_hours' => $request->cancellation_deadline_hours ?? 48,
            'cancellation_refund_percent' => $request->cancellation_refund_percent ?? 100,
        ]);

        // Sync amenities
        $hotel->amenities()->sync($request->input('amenities', []));

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

        return redirect()->route('admin.hotels.index')
            ->with('success', 'Hotel updated successfully.');
    }

    public function destroy(Hotel $hotel): RedirectResponse
    {
        $hotel->delete();

        return redirect()->route('admin.hotels.index')
            ->with('success', 'Hotel deleted successfully.');
    }
}
