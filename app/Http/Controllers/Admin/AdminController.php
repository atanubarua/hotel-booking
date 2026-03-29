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
        $users = \App\Models\User::latest()->get()->map(function ($user) {
            return [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value ?? (string) $user->role,
                'phone' => '+1 555-0000',
                'status' => 'active',
                'createdAt' => $user->created_at ? $user->created_at->format('Y-m-d') : now()->format('Y-m-d'),
            ];
        });

        return Inertia::render('admin/users/index', [
            'users' => $users
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

    public function bookings(): Response
    {
        return Inertia::render('admin/bookings/index');
    }
}
