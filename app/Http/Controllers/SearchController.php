<?php

namespace App\Http\Controllers;

use App\Models\Hotel;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Hotel::query()
            ->where('status', 'active')
            ->with(['images', 'rooms'])
            ->withMin('rooms', 'price_per_night')
            ->withMax('rooms', 'price_per_night');

        // Location / city / hotel name filter
        if ($request->filled('location')) {
            $searchTerm = (string) $request->input('location');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('city', 'like', '%' . $searchTerm . '%')
                  ->orWhere('name', 'like', '%' . $searchTerm . '%');
            });
        }

        // Star rating filter (array of selected stars)
        if ($request->filled('stars')) {
            $stars = array_map('intval', (array) $request->input('stars'));
            $query->whereIn('star_rating', $stars);
        }

        // Price range filter
        if ($request->filled('min_price')) {
            $query->whereHas('rooms', function ($q) use ($request) {
                $q->where('price_per_night', '>=', (float) $request->input('min_price'));
            });
        }
        if ($request->filled('max_price')) {
            $query->whereHas('rooms', function ($q) use ($request) {
                $q->where('price_per_night', '<=', (float) $request->input('max_price'));
            });
        }

        // Room type filter
        if ($request->filled('room_type')) {
            $types = (array) $request->input('room_type');
            $query->whereHas('rooms', function ($q) use ($types) {
                $q->whereIn('type', $types);
            });
        }

        // Sort
        $sort = $request->input('sort', 'recommended');
        match ($sort) {
            'price_asc'  => $query->orderBy('rooms_min_price_per_night', 'asc'),
            'price_desc' => $query->orderByDesc('rooms_min_price_per_night', 'desc'),
            'stars_desc' => $query->orderBy('star_rating', 'desc'),
            default      => $query->orderBy('star_rating', 'desc'),
        };

        $hotels = $query->get();

        // Price bounds for the slider
        $priceMin = Hotel::where('status', 'active')
            ->withMin('rooms', 'price_per_night')
            ->get()
            ->min('rooms_min_price_per_night') ?? 0;

        $priceMax = Hotel::where('status', 'active')
            ->withMax('rooms', 'price_per_night')
            ->get()
            ->max('rooms_max_price_per_night') ?? 50000;

        return Inertia::render('hotels/search', [
            'hotels'   => $hotels,
            'filters'  => $request->only(['location', 'checkin', 'checkout', 'guests', 'stars', 'min_price', 'max_price', 'room_type', 'sort']),
            'priceMin' => (int) $priceMin,
            'priceMax' => (int) $priceMax,
        ]);
    }
}
