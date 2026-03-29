<?php

namespace App\Support;

use App\Models\Room;
use App\Models\RoomPriceRule;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

class RoomPricing
{
    /**
     * @param  CarbonInterface|string|null  $date
     * @return array{base_price: float, effective_price: float, applied_rule: ?RoomPriceRule}
     */
    public static function resolve(Room $room, CarbonInterface|string|null $date = null): array
    {
        $targetDate = self::normalizeDate($date);
        $basePrice = (float) $room->price_per_night;
        $appliedRule = self::matchingRules($room, $targetDate)->first();

        if (! $appliedRule) {
            return [
                'base_price' => $basePrice,
                'effective_price' => $basePrice,
                'applied_rule' => null,
            ];
        }

        $effectivePrice = match ($appliedRule->adjustment_type) {
            'fixed' => (float) $appliedRule->adjustment_value,
            'amount' => $basePrice + (float) $appliedRule->adjustment_value,
            'percent' => $basePrice * (1 + ((float) $appliedRule->adjustment_value / 100)),
            default => $basePrice,
        };

        return [
            'base_price' => $basePrice,
            'effective_price' => round(max($effectivePrice, 0), 2),
            'applied_rule' => $appliedRule,
        ];
    }

    /**
     * @param  CarbonInterface|string|null  $date
     */
    public static function matchingRules(Room $room, CarbonInterface|string|null $date = null)
    {
        $targetDate = self::normalizeDate($date);
        $rules = $room->relationLoaded('priceRules')
            ? $room->priceRules
            : $room->priceRules()->get();

        return $rules
            ->filter(fn (RoomPriceRule $rule) => $rule->is_active
                && $rule->start_date->lte($targetDate)
                && $rule->end_date->gte($targetDate))
            ->sortByDesc(fn (RoomPriceRule $rule) => [$rule->priority, $rule->start_date->timestamp, $rule->id])
            ->values();
    }

    /**
     * @param  CarbonInterface|string|null  $date
     */
    protected static function normalizeDate(CarbonInterface|string|null $date): CarbonImmutable
    {
        if ($date instanceof CarbonInterface) {
            return CarbonImmutable::instance($date)->startOfDay();
        }

        if (is_string($date) && $date !== '') {
            return CarbonImmutable::parse($date)->startOfDay();
        }

        return CarbonImmutable::today();
    }
}
