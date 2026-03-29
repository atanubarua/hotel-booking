<?php

namespace App\Support;

use App\Models\Room;
use App\Models\RoomPriceRule;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

class RoomPricing
{
    /**
     * Resolve the price for a single night (checkin date).
     * Stackable rules (percent/amount) are all applied in priority order.
     * If a non-stackable rule exists it wins outright (highest priority first).
     * A fixed rule always wins and cannot stack.
     *
     * @param  CarbonInterface|string|null  $date
     * @return array{base_price: float, effective_price: float, applied_rule: ?RoomPriceRule}
     */
    public static function resolve(Room $room, CarbonInterface|string|null $date = null): array
    {
        $targetDate  = self::normalizeDate($date);
        $basePrice   = (float) $room->price_per_night;
        $matchingRules = self::matchingRules($room, $targetDate);

        if ($matchingRules->isEmpty()) {
            return [
                'base_price'      => $basePrice,
                'effective_price' => $basePrice,
                'applied_rule'    => null,
            ];
        }

        // A fixed rule always wins — no stacking possible
        $fixedRule = $matchingRules->first(fn (RoomPriceRule $r) => $r->adjustment_type === 'fixed');
        if ($fixedRule) {
            return [
                'base_price'      => $basePrice,
                'effective_price' => round(max((float) $fixedRule->adjustment_value, 0), 2),
                'applied_rule'    => $fixedRule,
            ];
        }

        // Check if the highest-priority rule is non-stackable — it wins alone
        $topRule = $matchingRules->first();
        if (! $topRule->is_stackable) {
            $effectivePrice = match ($topRule->adjustment_type) {
                'amount'  => $basePrice + (float) $topRule->adjustment_value,
                'percent' => $basePrice * (1 + ((float) $topRule->adjustment_value / 100)),
                default   => $basePrice,
            };
            return [
                'base_price'      => $basePrice,
                'effective_price' => round(max($effectivePrice, 0), 2),
                'applied_rule'    => $topRule,
            ];
        }

        // Stack all stackable rules in priority order
        $price      = $basePrice;
        $lastRule   = null;
        foreach ($matchingRules as $rule) {
            if (! $rule->is_stackable) {
                break; // stop stacking when we hit a non-stackable rule
            }
            $price = match ($rule->adjustment_type) {
                'amount'  => $price + (float) $rule->adjustment_value,
                'percent' => $price * (1 + ((float) $rule->adjustment_value / 100)),
                default   => $price,
            };
            $lastRule = $rule;
        }

        return [
            'base_price'      => $basePrice,
            'effective_price' => round(max($price, 0), 2),
            'applied_rule'    => $lastRule,
        ];
    }

    /**
     * Resolve the total price across a multi-night stay.
     * Each night is priced individually based on its own matching rule.
     *
     * @param  CarbonInterface|string|null  $checkin
     * @param  CarbonInterface|string|null  $checkout
     * @return array{
     *   nights: int,
     *   total_price: float,
     *   avg_price_per_night: float,
     *   applied_rule: ?RoomPriceRule,
     *   breakdown: array<array{date: string, price: float, rule_name: ?string}>
     * }
     */
    public static function resolveStay(
        Room $room,
        CarbonInterface|string|null $checkin = null,
        CarbonInterface|string|null $checkout = null,
    ): array {
        $checkinDate  = self::normalizeDate($checkin);
        $checkoutDate = self::normalizeDate($checkout);

        // Fall back to single-night if dates are missing or invalid
        if ($checkoutDate->lte($checkinDate)) {
            $single = self::resolve($room, $checkinDate);
            return [
                'nights'              => 1,
                'total_price'         => $single['effective_price'],
                'avg_price_per_night' => $single['effective_price'],
                'applied_rule'        => $single['applied_rule'],
                'breakdown'           => [[
                    'date'      => $checkinDate->toDateString(),
                    'price'     => $single['effective_price'],
                    'rule_name' => $single['applied_rule']?->name,
                    'season_type' => $single['applied_rule']?->season_type,
                ]],
            ];
        }

        $nights    = (int) $checkinDate->diffInDays($checkoutDate);
        $total     = 0.0;
        $breakdown = [];
        $lastRule  = null;

        for ($i = 0; $i < $nights; $i++) {
            $night   = $checkinDate->addDays($i);
            $pricing = self::resolve($room, $night);
            $total  += $pricing['effective_price'];

            $breakdown[] = [
                'date'        => $night->toDateString(),
                'price'       => $pricing['effective_price'],
                'rule_name'   => $pricing['applied_rule']?->name,
                'season_type' => $pricing['applied_rule']?->season_type,
            ];

            if ($pricing['applied_rule']) {
                $lastRule = $pricing['applied_rule'];
            }
        }

        return [
            'nights'              => $nights,
            'total_price'         => round($total, 2),
            'avg_price_per_night' => round($total / $nights, 2),
            'applied_rule'        => $lastRule,
            'breakdown'           => $breakdown,
        ];
    }

    /**
     * @param  CarbonInterface|string|null  $date
     */
    public static function matchingRules(Room $room, CarbonInterface|string|null $date = null)
    {
        $targetDate = self::normalizeDate($date);
        $dayOfWeek  = (int) $targetDate->dayOfWeek; // 0=Sun … 6=Sat

        $rules = $room->relationLoaded('priceRules')
            ? $room->priceRules
            : $room->priceRules()->get();

        return $rules
            ->filter(function (RoomPriceRule $rule) use ($targetDate, $dayOfWeek) {
                if (! $rule->is_active) {
                    return false;
                }

                $days      = $rule->days_of_week; // array|null
                $hasDays   = ! empty($days);
                $hasRange  = $rule->start_date !== null && $rule->end_date !== null;

                // Day-of-week rule (with optional date range boundary)
                if ($hasDays) {
                    if (! in_array($dayOfWeek, $days, true)) {
                        return false;
                    }
                    // If a date range is also set, the target must fall within it
                    if ($hasRange) {
                        return $rule->start_date->lte($targetDate) && $rule->end_date->gte($targetDate);
                    }
                    return true;
                }

                // Plain date-range rule
                if ($hasRange) {
                    return $rule->start_date->lte($targetDate) && $rule->end_date->gte($targetDate);
                }

                return false;
            })
            ->sortByDesc(fn (RoomPriceRule $rule) => [
                $rule->priority,
                $rule->start_date?->timestamp ?? 0,
                $rule->id,
            ])
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
