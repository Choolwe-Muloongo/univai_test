<?php

namespace App\Support\Access;

class AccessDecision
{
    public function __construct(
        public readonly bool $allowed,
        public readonly string $reason = 'allowed',
        public readonly int $status = 200,
    ) {
    }

    public static function allow(): self
    {
        return new self(true);
    }

    public static function deny(string $reason, int $status = 403): self
    {
        return new self(false, $reason, $status);
    }
}
