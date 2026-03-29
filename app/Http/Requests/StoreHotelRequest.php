<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreHotelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, string>
     */
    public function rules(): array
    {
        return [
            'name'          => 'required|string|max:255',
            'address'       => 'required|string|max:500',
            'city'          => 'required|string|max:100',
            'country'       => 'required|string|max:100',
            'star_rating'   => 'required|integer|between:1,5',
            'phone'         => 'required|string|max:30',
            'email'         => 'required|email|max:255',
            'description'   => 'nullable|string',
            'status'        => 'required|in:active,inactive,pending',
            'partner_name'  => 'required|string|max:255',
            'partner_email' => 'required|email|max:255|unique:users,email',
            'images'        => 'nullable|array|max:10',
            'images.*'      => 'image|mimes:jpeg,png,jpg,webp|max:5120',
        ];
    }
}
