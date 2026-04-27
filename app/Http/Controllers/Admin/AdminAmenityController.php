<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Amenity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminAmenityController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/amenities/index', [
            'amenities' => Amenity::orderBy('name')->withCount('hotels')->get(['id', 'name', 'icon']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:100|unique:amenities,name',
            'icon' => 'required|string|max:100',
        ]);

        Amenity::create($request->only('name', 'icon'));

        return back()->with('success', 'Amenity created.');
    }

    public function update(Request $request, Amenity $amenity): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:100|unique:amenities,name,' . $amenity->id,
            'icon' => 'required|string|max:100',
        ]);

        $amenity->update($request->only('name', 'icon'));

        return back()->with('success', 'Amenity updated.');
    }

    public function destroy(Amenity $amenity): RedirectResponse
    {
        $amenity->delete();

        return back()->with('success', 'Amenity deleted.');
    }
}
