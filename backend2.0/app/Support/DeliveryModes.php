<?php

namespace App\Support;

class DeliveryModes
{
    public const SOFTWARE_ONLY = 'software_only';
    public const HYBRID = 'hybrid';
    public const PHYSICAL = 'physical';

    public const ALL = [
        self::SOFTWARE_ONLY,
        self::HYBRID,
        self::PHYSICAL,
    ];

    public static function normalize(?string $mode): string
    {
        return match ($mode) {
            'online', 'software', 'software-only' => self::SOFTWARE_ONLY,
            'campus', 'physical_learning', 'physical-learning' => self::PHYSICAL,
            self::SOFTWARE_ONLY, self::HYBRID, self::PHYSICAL => $mode,
            default => self::HYBRID,
        };
    }

    public static function normalizeMany(?array $modes): array
    {
        $normalized = collect($modes ?? [])
            ->map(fn ($mode) => is_string($mode) ? self::normalize($mode) : null)
            ->filter(fn ($mode) => in_array($mode, self::ALL, true))
            ->unique()
            ->values()
            ->all();

        return $normalized ?: self::ALL;
    }

    public static function supports(?array $modes, ?string $selectedMode): bool
    {
        return in_array(self::normalize($selectedMode), self::normalizeMany($modes), true);
    }

    public static function feeMultiplier(?string $mode): float
    {
        return match (self::normalize($mode)) {
            self::SOFTWARE_ONLY => 0.85,
            self::PHYSICAL => 1.15,
            default => 1.0,
        };
    }
}
