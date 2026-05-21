<?php

use App\Http\Controllers\Api\ShortCourseAccessController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::middleware(['api', 'session.auth'])->prefix('api')->group(function () {
    Route::get('/students/me/short-courses/{courseId}/access-plans', [ShortCourseAccessController::class, 'plans']);
    Route::post('/students/me/short-courses/{courseId}/access-plans/purchase', [ShortCourseAccessController::class, 'purchase']);
    Route::get('/students/me/short-courses/bundles', [ShortCourseAccessController::class, 'bundlePlans']);
    Route::post('/students/me/short-courses/bundles/purchase', [ShortCourseAccessController::class, 'purchaseBundle']);
});
