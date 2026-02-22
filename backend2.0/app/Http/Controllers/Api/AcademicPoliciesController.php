<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicPolicy;
use App\Models\CurriculumVersionPolicy;
use App\Models\ProgramPolicy;
use Illuminate\Http\Request;

class AcademicPoliciesController extends Controller
{
    public function index()
    {
        return AcademicPolicy::query()->orderBy('id')->get();
    }

    public function store(Request $request)
    {
        $payload = $this->validatePayload($request);
        $policy = AcademicPolicy::create($payload);

        return response()->json($policy, 201);
    }

    public function update(Request $request, AcademicPolicy $policy)
    {
        $payload = $this->validatePayload($request, true);
        $policy->update($payload);

        return response()->json($policy);
    }

    public function assignProgram(Request $request)
    {
        $payload = $request->validate([
            'program_id' => ['required', 'string'],
            'policy_id' => ['required', 'integer', 'exists:academic_policies,id'],
        ]);

        $record = ProgramPolicy::query()->updateOrCreate(
            ['program_id' => $payload['program_id']],
            ['policy_id' => $payload['policy_id']]
        );

        return response()->json($record);
    }

    public function assignCurriculum(Request $request)
    {
        $payload = $request->validate([
            'curriculum_version_id' => ['required', 'string'],
            'policy_id' => ['required', 'integer', 'exists:academic_policies,id'],
        ]);

        $record = CurriculumVersionPolicy::query()->updateOrCreate(
            ['curriculum_version_id' => $payload['curriculum_version_id']],
            ['policy_id' => $payload['policy_id']]
        );

        return response()->json($record);
    }

    private function validatePayload(Request $request, bool $partial = false): array
    {
        $rules = [
            'name' => [$partial ? 'sometimes' : 'required', 'string'],
            'pass_mark' => [$partial ? 'sometimes' : 'required', 'integer', 'min:0', 'max:100'],
            'exam_minimum' => ['nullable', 'integer', 'min:0', 'max:100'],
            'gpa_scale_type' => [$partial ? 'sometimes' : 'required', 'string'],
            'grade_bands' => [$partial ? 'sometimes' : 'required', 'array'],
            'repeat_rule' => [$partial ? 'sometimes' : 'required', 'string'],
            'max_attempts' => [$partial ? 'sometimes' : 'required', 'integer', 'min:1'],
            'include_failed_in_gpa' => [$partial ? 'sometimes' : 'required', 'boolean'],
            'include_withdrawn_in_gpa' => [$partial ? 'sometimes' : 'required', 'boolean'],
            'credit_award_policy' => [$partial ? 'sometimes' : 'required', 'string'],
            'condoned_mark' => ['nullable', 'integer', 'min:0', 'max:100'],
            'progression_policy' => [$partial ? 'sometimes' : 'nullable', 'array'],
            'holds_policy' => [$partial ? 'sometimes' : 'nullable', 'array'],
            'rounding_decimals' => [$partial ? 'sometimes' : 'required', 'integer', 'min:0', 'max:4'],
        ];

        return $request->validate($rules);
    }
}
