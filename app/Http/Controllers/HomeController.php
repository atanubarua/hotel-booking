<?php

namespace App\Http\Controllers;

use App\Models\Hotel;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Hotel::query()
            ->where('status', 'active')
            ->with(['images', 'rooms'])
            ->withMin('rooms', 'price_per_night');

        if ($request->filled('location')) {
            $searchTerm = (string) $request->input('location');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('city', 'like', '%' . $searchTerm . '%')
                  ->orWhere('name', 'like', '%' . $searchTerm . '%');
            });
        }

        // Show 6 featured hotels on homepage, or all results when searching
        if ($request->filled('location')) {
            $hotels = $query->orderBy('star_rating', 'desc')->get();
        } else {
            $hotels = $query->orderBy('star_rating', 'desc')->limit(6)->get();
        }

        return Inertia::render('welcome', [
            'hotels' => $hotels,
            'filters' => $request->only(['location', 'checkin', 'checkout', 'guests']),
            'canRegister' => \Laravel\Fortify\Features::enabled(\Laravel\Fortify\Features::registration()),
        ]);
    }
}
