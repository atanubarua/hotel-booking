<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function dashboard(): Response
    {
        return Inertia::render('admin/dashboard');
    }

    public function users(): Response
    {
        $perPage = request()->integer('per_page', 15);
        $page = request()->integer('page', 1);
        $search = request()->input('search');
        $hotelId = request()->input('hotel');

        // Get all hotels for the filter dropdown (not paginated)
        $allHotels = \App\Models\Hotel::orderBy('name')->get(['id', 'name'])->map(function ($hotel) {
            return [
                'id' => (string) $hotel->id,
                'name' => $hotel->name,
            ];
        });

        $query = \App\Models\User::query()->latest();

        // Search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Hotel filter - only for partners with specific hotels
        if ($hotelId && $hotelId !== 'all') {
            $query->whereHas('hotels', function ($q) use ($hotelId) {
                $q->where('hotels.id', $hotelId);
            });
        }

        $paginated = $query->paginate($perPage, ['*'], 'page', $page);

        $users = collect($paginated->items())->map(function ($user) {
            $hotels = $user->hotels()->get(['id', 'name'])->map(function ($hotel) {
                return [
                    'id' => (string) $hotel->id,
                    'name' => $hotel->name,
                ];
            });

            return [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value ?? (string) $user->role,
                'phone' => '+1 555-0000',
                'status' => 'active',
                'createdAt' => $user->created_at ? $user->created_at->format('Y-m-d') : now()->format('Y-m-d'),
                'hotels' => $hotels,
            ];
        });

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'hotels' => $allHotels,
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    public function hotels(): Response
    {
        return Inertia::render('admin/hotels/index');
    }

    public function rooms(): Response
    {
        return Inertia::render('admin/rooms/index');
    }

}
