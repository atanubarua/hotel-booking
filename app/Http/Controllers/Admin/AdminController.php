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
        return Inertia::render('admin/users/index');
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
