<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomRequest extends FormRequest
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
            'hotel_id'        => 'required|exists:hotels,id',
            'name'            => 'required|string|max:255',
            'type'            => 'required|in:Standard,Deluxe,Suite',
            'capacity'        => 'required|integer|min:1',
            'price_per_night' => 'required|numeric|min:0',
            'status'          => 'required|in:available,occupied,maintenance',
            'images'          => 'nullable|array|max:10',
            'images.*'        => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            'delete_images'   => 'nullable|array',
            'delete_images.*' => 'integer',
        ];
    }
}
