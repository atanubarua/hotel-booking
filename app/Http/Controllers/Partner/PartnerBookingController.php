<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class PartnerBookingController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = $request->integer('per_page', 15);
        $page = $request->integer('page', 1);
        $search = $request->input('search');

        $query = Booking::with(['hotel:id,name', 'room:id,name'])
            ->whereHas('hotel', function ($q) {
                $q->where('user_id', auth()->id());
            })
            ->latest();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('guest_name', 'like', "%{$search}%")
                  ->orWhere('guest_email', 'like', "%{$search}%")
                  ->orWhere('status', 'like', "%{$search}%")
                  ->orWhereHas('hotel', function ($hq) use ($search) {
                      $hq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $paginated = $query->paginate($perPage, ['*'], 'page', $page);

        $bookings = collect($paginated->items())->map(function ($booking) {
            return [
                'id' => (string) $booking->id,
                'guestName' => $booking->guest_name,
                'guestEmail' => $booking->guest_email,
                'hotelName' => $booking->hotel->name ?? 'Unknown',
                'roomName' => $booking->room->name ?? 'Unknown',
                'checkIn' => $booking->check_in->format('Y-m-d'),
                'checkOut' => $booking->check_out->format('Y-m-d'),
                'totalAmount' => (float) $booking->total_price,
                'status' => $booking->status,
            ];
        });

        return Inertia::render('partner/bookings/index', [
            'bookings' => $bookings,
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
            'filters' => [
                'search' => $search,
            ]
        ]);
    }

    public function update(Request $request, Booking $booking): RedirectResponse
    {
        // Ensure partner owns the hotel for this booking
        if ($booking->hotel->user_id !== auth()->id()) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'status' => 'required|string|in:pending,confirmed,checked_in,checked_out,completed,cancelled,no_show,expired',
        ]);

        $booking->update([
            'status' => $validated['status'],
        ]);

        if ($validated['status'] === 'cancelled' && !$booking->cancelled_at) {
            $booking->update(['cancelled_at' => now()]);
        }

        return redirect()->back()->with('success', 'Booking status updated successfully.');
    }

    public function destroy(Booking $booking): RedirectResponse
    {
        // Ensure partner owns the hotel for this booking
        if ($booking->hotel->user_id !== auth()->id()) {
            abort(403, 'Unauthorized action.');
        }

        $booking->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Booking cancelled successfully.');
    }
}
