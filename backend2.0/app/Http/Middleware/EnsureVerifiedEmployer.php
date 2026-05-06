<?php

namespace App\Http\Middleware;

use App\Models\EmployerVerification;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureVerifiedEmployer
{
    public function handle(Request $request, Closure $next): Response
    {
        $sessionUser = $request->session()->get('user');
        if (!is_array($sessionUser) || ($sessionUser['role'] ?? null) !== 'employer') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (($sessionUser['employerVerificationStatus'] ?? null) === 'verified') {
            return $next($request);
        }

        $userId = $sessionUser['id'] ?? null;
        $email = $sessionUser['email'] ?? null;

        $verified = EmployerVerification::query()
            ->where('status', 'verified')
            ->where('workflow_type', 'employer')
            ->where(function ($query) use ($userId, $email) {
                if (is_numeric($userId)) {
                    $query->where('user_id', (int) $userId);
                }

                if ($email) {
                    $method = is_numeric($userId) ? 'orWhere' : 'where';
                    $query->{$method}('contact_email', strtolower($email));
                }
            })
            ->exists();

        if (!$verified) {
            return response()->json([
                'message' => 'Employer verification is required before posting opportunities or managing applicants.',
                'verificationStatus' => 'unverified',
            ], 403);
        }

        return $next($request);
    }
}
