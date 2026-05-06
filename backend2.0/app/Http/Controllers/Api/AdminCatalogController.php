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
            [
                'code' => strtoupper(str_replace('-', '_', $id)),
                'name' => $payload['name'],
                'status' => 'active',
            ]
        );

        return [
            'id' => $school->id,
            'code' => $school->code,
            'name' => $school->name,
            'status' => $school->status,
        ];
    }

    public function createCourse(Request $request)
    {
        $payload = $request->validate([
            'id' => ['required', 'string'],
            'title' => ['required', 'string'],
            'description' => ['required', 'string'],
            'schoolId' => ['required', 'string'],
            'programmeId' => ['nullable', 'string'],
            'departmentId' => ['nullable', 'string'],
            'imageId' => ['nullable', 'string'],
        ]);

        $course = Course::updateOrCreate(
            ['id' => $payload['id']],
            [
                'title' => $payload['title'],
                'description' => $payload['description'],
                'school_id' => $payload['schoolId'],
                'programme_id' => $payload['programmeId'] ?? null,
                'department_id' => $payload['departmentId'] ?? null,
                'progress' => 0,
                'image_id' => $payload['imageId'] ?? null,
            ]
        );

        return [
            'id' => $course->id,
            'title' => $course->title,
            'description' => $course->description,
            'schoolId' => $course->school_id,
            'programmeId' => $course->programme_id,
            'departmentId' => $course->department_id,
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
