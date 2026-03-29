<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\Room;
use Inertia\Inertia;
use Inertia\Response;

class PartnerController extends Controller
{
    public function dashboard(): Response
    {
        $hotelCount = Hotel::where('user_id', auth()->id())->count();
        $roomCount = Room::whereHas('hotel', fn ($q) => $q->where('user_id', auth()->id()))->count();

        return Inertia::render('partner/dashboard', [
            'hotelCount' => $hotelCount,
            'roomCount' => $roomCount,
        ]);
    }
}
