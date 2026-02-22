<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\School;
use Illuminate\Http\Request;

class AdminCatalogController extends Controller
{
    public function createSchool(Request $request)
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'min:2'],
        ]);

        $id = strtolower(preg_replace('/\s+/', '-', $payload['name']));
        $school = School::updateOrCreate(
            ['id' => $id],
            ['name' => $payload['name']]
        );

        return [
            'id' => $school->id,
            'name' => $school->name,
        ];
    }

    public function createCourse(Request $request)
    {
        $payload = $request->validate([
            'id' => ['required', 'string'],
            'title' => ['required', 'string'],
            'description' => ['required', 'string'],
            'schoolId' => ['required', 'string'],
            'imageId' => ['nullable', 'string'],
        ]);

        $course = Course::updateOrCreate(
            ['id' => $payload['id']],
            [
                'title' => $payload['title'],
                'description' => $payload['description'],
                'school_id' => $payload['schoolId'],
                'progress' => 0,
                'image_id' => $payload['imageId'] ?? null,
            ]
        );

        return [
            'id' => $course->id,
            'title' => $course->title,
            'description' => $course->description,
            'schoolId' => $course->school_id,
            'progress' => $course->progress,
            'imageId' => $course->image_id,
        ];
    }

    public function deleteSchool(string $id)
    {
        School::where('id', $id)->delete();
        Course::where('school_id', $id)->delete();

        return response()->noContent();
    }

    public function deleteCourse(string $id)
    {
        Course::where('id', $id)->delete();
        return response()->noContent();
    }
}
