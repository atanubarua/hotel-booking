<?php

namespace App\Http\Controllers;

use App\Models\Hotel;
use App\Support\RoomPricing;
use Illuminate\Support\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    public function index(Request $request): Response
    {
        $request->validate([
            'location' => 'required|string|max:255',
            'checkin' => 'required|date|after_or_equal:today',
            'checkout' => 'required|date|after:checkin',
            'guests' => 'nullable|integer|min:1',
        ]);

        $guests = (int) $request->input('guests', 1);
        $pricingDate = $request->input('checkin');

        $hotels = Hotel::query()
            ->where('status', 'active')
            ->with(['images', 'rooms.images', 'rooms.priceRules'])
            ->get();

        if ($request->filled('location')) {
            $searchTerm = (string) $request->input('location');
            $hotels = $hotels->filter(function (Hotel $hotel) use ($searchTerm) {
                return str_contains(strtolower($hotel->city), strtolower($searchTerm))
                    || str_contains(strtolower($hotel->name), strtolower($searchTerm));
            })->values();
        }

        if ($request->filled('stars')) {
            $stars = array_map('intval', (array) $request->input('stars'));
            $hotels = $hotels->whereIn('star_rating', $stars)->values();
        }

        $hotels = $this->mapHotelsWithEffectivePrices($hotels, $pricingDate, $guests);

        if ($request->filled('room_type')) {
            $types = (array) $request->input('room_type');
            $hotels = $hotels->map(function (array $hotel) use ($types) {
                $hotel['rooms'] = array_values(array_filter(
                    $hotel['rooms'],
                    fn (array $room) => in_array($room['type'], $types, true)
                ));
                $this->hydrateHotelPriceRange($hotel);

                return $hotel;
            })->filter(fn (array $hotel) => count($hotel['rooms']) > 0)->values();
        }

        $priceMin = (int) floor($hotels->pluck('rooms_min_price_per_night')->filter()->min() ?? 0);
        $priceMax = (int) ceil($hotels->pluck('rooms_max_price_per_night')->filter()->max() ?? 50000);

        if ($request->filled('min_price')) {
            $minimum = (float) $request->input('min_price');
            $hotels = $hotels->map(function (array $hotel) use ($minimum) {
                $hotel['rooms'] = array_values(array_filter(
                    $hotel['rooms'],
                    fn (array $room) => $room['effective_price'] >= $minimum
                ));
                $this->hydrateHotelPriceRange($hotel);

                return $hotel;
            })->filter(fn (array $hotel) => count($hotel['rooms']) > 0)->values();
        }

        if ($request->filled('max_price')) {
            $maximum = (float) $request->input('max_price');
            $hotels = $hotels->map(function (array $hotel) use ($maximum) {
                $hotel['rooms'] = array_values(array_filter(
                    $hotel['rooms'],
                    fn (array $room) => $room['effective_price'] <= $maximum
                ));
                $this->hydrateHotelPriceRange($hotel);

                return $hotel;
            })->filter(fn (array $hotel) => count($hotel['rooms']) > 0)->values();
        }

        $sort = $request->input('sort', 'recommended');
        $hotels = match ($sort) {
            'price_asc' => $hotels->sortBy('rooms_min_price_per_night')->values(),
            'price_desc' => $hotels->sortByDesc('rooms_min_price_per_night')->values(),
            'stars_desc' => $hotels->sortByDesc('star_rating')->values(),
            default => $hotels->sortByDesc('star_rating')->values(),
        };

        return Inertia::render('hotels/search', [
            'hotels'   => $hotels,
            'filters'  => $request->only(['location', 'checkin', 'checkout', 'guests', 'stars', 'min_price', 'max_price', 'room_type', 'sort']),
            'priceMin' => (int) $priceMin,
            'priceMax' => (int) $priceMax,
        ]);
    }

    public function show(Request $request, Hotel $hotel): Response
    {
        $request->validate([
            'checkin' => 'nullable|date',
            'checkout' => 'nullable|date|after_or_equal:checkin',
            'guests' => 'nullable|integer|min:1',
        ]);

        $hotel->load(['images' => function ($query) {
            $query->orderBy('order');
        }]);

        $guests = $request->input('guests', 1);
        $pricingDate = $request->input('checkin');

        $rooms = $hotel->rooms()
            ->where('status', 'available')
            ->where('capacity', '>=', $guests)
            ->with(['images' => function ($query) {
                $query->orderBy('order');
            }, 'priceRules'])
            ->get();

        $rooms = $rooms->map(function ($room) use ($pricingDate) {
            $pricing = RoomPricing::resolve($room, $pricingDate);

            return [
                'id' => $room->id,
                'name' => $room->name,
                'type' => $room->type,
                'capacity' => $room->capacity,
                'price_per_night' => $room->price_per_night,
                'effective_price' => $pricing['effective_price'],
                'price_rule_name' => $pricing['applied_rule']?->name,
                'status' => $room->status,
                'images' => $room->images->map(fn ($image) => [
                    'id' => $image->id,
                    'path' => $image->path,
                    'order' => $image->order,
                ])->values()->all(),
            ];
        })->values();

        return Inertia::render('hotels/show', [
            'hotel' => $hotel,
            'rooms' => $rooms,
            'filters' => $request->only(['checkin', 'checkout', 'guests']),
        ]);
    }

    private function mapHotelsWithEffectivePrices(Collection $hotels, ?string $pricingDate, int $guests): Collection
    {
        return $hotels->map(function (Hotel $hotel) use ($pricingDate, $guests) {
            $rooms = $hotel->rooms
                ->filter(fn ($room) => $room->status === 'available' && $room->capacity >= $guests)
                ->map(function ($room) use ($pricingDate) {
                    $pricing = RoomPricing::resolve($room, $pricingDate);

                    return [
                        'id' => $room->id,
                        'name' => $room->name,
                        'type' => $room->type,
                        'capacity' => $room->capacity,
                        'price_per_night' => (float) $room->price_per_night,
                        'effective_price' => $pricing['effective_price'],
                        'price_rule_name' => $pricing['applied_rule']?->name,
                        'status' => $room->status,
                    ];
                })
                ->values()
                ->all();

            $payload = [
                'id' => $hotel->id,
                'name' => $hotel->name,
                'address' => $hotel->address,
                'city' => $hotel->city,
                'country' => $hotel->country,
                'star_rating' => $hotel->star_rating,
                'description' => $hotel->description,
                'status' => $hotel->status,
                'images' => $hotel->images->map(fn ($image) => [
                    'id' => $image->id,
                    'path' => $image->path,
                    'order' => $image->order,
                ])->values()->all(),
                'rooms' => $rooms,
                'rooms_min_price_per_night' => null,
                'rooms_max_price_per_night' => null,
            ];

            $this->hydrateHotelPriceRange($payload);

            return $payload;
        })->filter(fn (array $hotel) => count($hotel['rooms']) > 0)->values();
    }

    private function hydrateHotelPriceRange(array &$hotel): void
    {
        $prices = collect($hotel['rooms'])->pluck('effective_price');
        $hotel['rooms_min_price_per_night'] = $prices->min();
        $hotel['rooms_max_price_per_night'] = $prices->max();
    }
}
