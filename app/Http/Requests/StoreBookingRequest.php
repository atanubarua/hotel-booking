<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Guest checkout allowed
    }

    public function rules(): array
    {
        return [
            'room_id'          => 'required|integer|exists:rooms,id',
            'check_in'         => 'required|date|after_or_equal:today',
            'check_out'        => 'required|date|after:check_in',
            'guests'           => 'required|integer|min:1|max:20',
            'guest_name'       => 'required|string|max:255',
            'guest_email'      => 'required|email|max:255',
            'guest_phone'      => 'required|string|max:30',
            'special_requests' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'check_in.after_or_equal' => 'Check-in date must be today or in the future.',
            'check_out.after'         => 'Check-out must be after the check-in date.',
            'guest_name.required'     => 'Please enter the guest name.',
            'guest_email.required'    => 'Please enter a valid email address.',
            'guest_phone.required'    => 'Please enter a contact phone number.',
        ];
    }
}
