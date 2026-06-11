<?php

use App\Http\Controllers\Api\ShortCourseAccessController;
use App\Http\Controllers\Api\ShortCourseLeaderboardController;
use App\Http\Controllers\Api\StudentGamificationController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::middleware(['api', 'session.auth'])->prefix('api')->group(function () {
    Route::get('/students/me/gamification', [StudentGamificationController::class, 'state']);
    Route::get('/students/me/daily-quests', [StudentGamificationController::class, 'dailyQuests']);
    Route::post('/students/me/learning-events', [StudentGamificationController::class, 'recordEvent']);
    Route::get('/students/me/rewards', [StudentGamificationController::class, 'rewards']);
    Route::post('/students/me/rewards/redeem', [StudentGamificationController::class, 'redeem']);
    Route::get('/students/me/leaderboard/activity', [StudentGamificationController::class, 'leaderboard']);
    Route::get('/students/me/mistakes', [StudentGamificationController::class, 'mistakes']);
    Route::post('/students/me/mistakes/{id}/review', [StudentGamificationController::class, 'reviewMistake']);

    Route::get('/students/me/short-courses/{courseId}/access-plans', [ShortCourseAccessController::class, 'plans']);
    Route::post('/students/me/short-courses/{courseId}/access-plans/purchase', [ShortCourseAccessController::class, 'purchase']);
    Route::get('/students/me/short-courses/bundles', [ShortCourseAccessController::class, 'bundlePlans']);
    Route::post('/students/me/short-courses/bundles/purchase', [ShortCourseAccessController::class, 'purchaseBundle']);
    Route::get('/students/me/short-courses/{courseId}/leaderboard', [ShortCourseLeaderboardController::class, 'show']);
});
