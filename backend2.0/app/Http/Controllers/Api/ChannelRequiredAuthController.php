<?php

namespace App\Http\Controllers\Api;

use App\Support\Affiliates\AffiliateService;
use Illuminate\Http\Request;

class ChannelRequiredAuthController extends AuthController
{
    public function register(Request $request, AffiliateService $affiliates)
    {
        $request->validate([
            'acceptedWhatsappChannel' => ['accepted'],
        ], [
            'acceptedWhatsappChannel.accepted' => 'Join the UnivAI WhatsApp channel before creating an account.',
        ]);

        return parent::register($request, $affiliates);
    }
}
