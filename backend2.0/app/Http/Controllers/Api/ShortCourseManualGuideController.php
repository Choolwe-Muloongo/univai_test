<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ShortCourses\ManualCourseBuilderGuideGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Support\Branding\UnivAiBranding;

class ShortCourseManualGuideController extends Controller
{
    public function download(Request $request, ManualCourseBuilderGuideGenerator $generator)
    {
        $path = $generator->ensureGuide();

        if (!Storage::disk('local')->exists($path)) {
            return response()->json(['message' => 'Manual builder guide is not available yet.'], 404);
        }

        return Storage::disk('local')->download($path, UnivAiBranding::name() . '-Manual-Course-Builder-Guide.pdf');
    }
}
