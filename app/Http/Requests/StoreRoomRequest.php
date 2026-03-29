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

    public function rules(): array
    {
        return [
            'hotel_id'        => 'required|exists:hotels,id',
            'name'            => 'required|string|max:255',
            'type'            => 'required|in:Standard,Deluxe,Suite',
            'capacity'        => 'required|integer|min:1',
            'price_per_night' => 'required|numeric|min:1',
            'status'          => 'required|in:available,occupied,maintenance',
            'images'          => 'nullable|array|max:10',
            'images.*'        => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            'price_rules'                    => 'nullable|array',
            'price_rules.*.id'               => 'nullable|integer|exists:room_price_rules,id',
            'price_rules.*.name'             => 'required_with:price_rules|string|max:255',
            'price_rules.*.season_type'      => 'nullable|in:festival,off_season,peak,weekend,holiday,custom',
            'price_rules.*.start_date'       => 'nullable|date',
            'price_rules.*.end_date'         => 'nullable|date',
            'price_rules.*.days_of_week'     => 'nullable|array',
            'price_rules.*.days_of_week.*'   => 'integer|min:0|max:6',
            'price_rules.*.adjustment_type'  => 'required_with:price_rules|in:fixed,percent,amount',
            'price_rules.*.adjustment_value' => 'required_with:price_rules|numeric',
            'price_rules.*.priority'         => 'nullable|integer|min:1|max:999',
            'price_rules.*.is_active'        => 'nullable|boolean',
            'price_rules.*.is_stackable'     => 'nullable|boolean',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $basePrice = (float) $this->input('price_per_night', 0);

            foreach ($this->input('price_rules', []) as $index => $rule) {
                $hasDays  = ! empty($rule['days_of_week'] ?? []);
                $hasStart = filled($rule['start_date'] ?? null);
                $hasEnd   = filled($rule['end_date'] ?? null);

                if (! $hasDays && ! $hasStart && ! $hasEnd) {
                    $validator->errors()->add("price_rules.$index.start_date", 'Provide a date range or select at least one day of the week.');
                }

                if ($hasStart && $hasEnd && $rule['end_date'] < $rule['start_date']) {
                    $validator->errors()->add("price_rules.$index.end_date", 'The end date must be after or equal to the start date.');
                }

                $type  = $rule['adjustment_type'] ?? null;
                $value = isset($rule['adjustment_value']) ? (float) $rule['adjustment_value'] : null;

                if ($type === null || $value === null) {
                    continue;
                }

                if ($type === 'percent' && ($value < -100 || $value > 500)) {
                    $validator->errors()->add("price_rules.$index.adjustment_value", 'Percent adjustment must be between -100% and +500%.');
                }

                if ($type === 'fixed' && $value <= 0) {
                    $validator->errors()->add("price_rules.$index.adjustment_value", 'Fixed price must be greater than zero.');
                }

                if ($type === 'fixed' && filter_var($rule['is_stackable'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                    $validator->errors()->add("price_rules.$index.is_stackable", 'Fixed price rules cannot be stackable.');
                }

                if ($type === 'amount' && ($basePrice + $value) <= 0) {
                    $validator->errors()->add("price_rules.$index.adjustment_value", "Amount adjustment would result in a price of zero or below (base: {$basePrice}).");
                }
            }
        });
    }
}
