<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreRoomRequest extends FormRequest
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
            'price_rules'                   => 'nullable|array',
            'price_rules.*.name'            => 'required_with:price_rules|string|max:255',
            'price_rules.*.start_date'      => 'required_with:price_rules|date',
            'price_rules.*.end_date'        => 'required_with:price_rules|date',
            'price_rules.*.adjustment_type' => 'required_with:price_rules|in:fixed,percent,amount',
            'price_rules.*.adjustment_value'=> 'required_with:price_rules|numeric',
            'price_rules.*.priority'        => 'nullable|integer|min:1|max:999',
            'price_rules.*.is_active'       => 'nullable|boolean',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            foreach ($this->input('price_rules', []) as $index => $rule) {
                if (
                    filled($rule['start_date'] ?? null)
                    && filled($rule['end_date'] ?? null)
                    && $rule['end_date'] < $rule['start_date']
                ) {
                    $validator->errors()->add("price_rules.$index.end_date", 'The end date must be after or equal to the start date.');
                }
            }
        });
    }
}
