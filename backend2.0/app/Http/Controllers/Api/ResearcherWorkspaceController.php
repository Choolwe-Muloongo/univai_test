<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchGrant;
use App\Models\ResearchLab;
use App\Models\ResearchPublication;
use App\Support\AuditLogger;
use Illuminate\Http\Request;

class ResearcherWorkspaceController extends Controller
{
    public function labsIndex(Request $request)
    {
        return ResearchLab::query()
            ->where('owner_id', $this->ownerId($request))
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ResearchLab $lab) => $this->mapLab($lab));
    }

    public function storeLab(Request $request)
    {
        $payload = $request->validate([
            'title' => ['required', 'string', 'max:190'],
            'description' => ['nullable', 'string'],
            'focusArea' => ['nullable', 'string', 'max:190'],
            'status' => ['nullable', 'string', 'in:active,paused,completed'],
            'collaborators' => ['nullable', 'array'],
        ]);

        $lab = ResearchLab::create([
            'owner_id' => $this->ownerId($request),
            'title' => $payload['title'],
            'description' => $payload['description'] ?? null,
            'focus_area' => $payload['focusArea'] ?? null,
            'status' => $payload['status'] ?? 'active',
            'collaborators' => $payload['collaborators'] ?? null,
        ]);

        AuditLogger::log($request, 'researcher.lab.created', 'research_lab', (string) $lab->id, ['title' => $lab->title]);

        return response()->json($this->mapLab($lab), 201);
    }

    public function updateLab(Request $request, ResearchLab $lab)
    {
        $this->authorizeOwner($request, $lab->owner_id);

        $payload = $request->validate([
            'title' => ['sometimes', 'string', 'max:190'],
            'description' => ['nullable', 'string'],
            'focusArea' => ['nullable', 'string', 'max:190'],
            'status' => ['sometimes', 'string', 'in:active,paused,completed'],
            'collaborators' => ['nullable', 'array'],
        ]);

        $lab->update([
            'title' => $payload['title'] ?? $lab->title,
            'description' => array_key_exists('description', $payload) ? $payload['description'] : $lab->description,
            'focus_area' => array_key_exists('focusArea', $payload) ? $payload['focusArea'] : $lab->focus_area,
            'status' => $payload['status'] ?? $lab->status,
            'collaborators' => array_key_exists('collaborators', $payload) ? $payload['collaborators'] : $lab->collaborators,
        ]);

        return response()->json($this->mapLab($lab));
    }

    public function destroyLab(Request $request, ResearchLab $lab)
    {
        $this->authorizeOwner($request, $lab->owner_id);
        $lab->delete();

        return response()->noContent();
    }

    public function grantsIndex(Request $request)
    {
        return ResearchGrant::query()
            ->where('owner_id', $this->ownerId($request))
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ResearchGrant $grant) => $this->mapGrant($grant));
    }

    public function storeGrant(Request $request)
    {
        $payload = $request->validate([
            'title' => ['required', 'string', 'max:190'],
            'funder' => ['nullable', 'string', 'max:190'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'status' => ['nullable', 'string', 'in:applied,awarded,active,completed,rejected'],
            'labId' => ['nullable', 'integer', 'exists:research_labs,id'],
            'startDate' => ['nullable', 'date'],
            'endDate' => ['nullable', 'date'],
        ]);

        $this->authorizeLabOwnership($request, $payload['labId'] ?? null);

        $grant = ResearchGrant::create([
            'owner_id' => $this->ownerId($request),
            'lab_id' => $payload['labId'] ?? null,
            'title' => $payload['title'],
            'funder' => $payload['funder'] ?? null,
            'amount' => $payload['amount'] ?? null,
            'currency' => $payload['currency'] ?? 'USD',
            'status' => $payload['status'] ?? 'applied',
            'start_date' => $payload['startDate'] ?? null,
            'end_date' => $payload['endDate'] ?? null,
        ]);

        AuditLogger::log($request, 'researcher.grant.created', 'research_grant', (string) $grant->id, ['title' => $grant->title]);

        return response()->json($this->mapGrant($grant), 201);
    }

    public function updateGrant(Request $request, ResearchGrant $grant)
    {
        $this->authorizeOwner($request, $grant->owner_id);

        $payload = $request->validate([
            'title' => ['sometimes', 'string', 'max:190'],
            'funder' => ['nullable', 'string', 'max:190'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'status' => ['sometimes', 'string', 'in:applied,awarded,active,completed,rejected'],
            'labId' => ['nullable', 'integer', 'exists:research_labs,id'],
            'startDate' => ['nullable', 'date'],
            'endDate' => ['nullable', 'date'],
        ]);

        if (array_key_exists('labId', $payload)) {
            $this->authorizeLabOwnership($request, $payload['labId']);
        }

        $grant->update([
            'title' => $payload['title'] ?? $grant->title,
            'funder' => array_key_exists('funder', $payload) ? $payload['funder'] : $grant->funder,
            'amount' => array_key_exists('amount', $payload) ? $payload['amount'] : $grant->amount,
            'currency' => $payload['currency'] ?? $grant->currency,
            'status' => $payload['status'] ?? $grant->status,
            'lab_id' => array_key_exists('labId', $payload) ? $payload['labId'] : $grant->lab_id,
            'start_date' => array_key_exists('startDate', $payload) ? $payload['startDate'] : $grant->start_date,
            'end_date' => array_key_exists('endDate', $payload) ? $payload['endDate'] : $grant->end_date,
        ]);

        return response()->json($this->mapGrant($grant));
    }

    public function destroyGrant(Request $request, ResearchGrant $grant)
    {
        $this->authorizeOwner($request, $grant->owner_id);
        $grant->delete();

        return response()->noContent();
    }

    public function publicationsIndex(Request $request)
    {
        return ResearchPublication::query()
            ->where('owner_id', $this->ownerId($request))
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ResearchPublication $publication) => $this->mapPublication($publication));
    }

    public function storePublication(Request $request)
    {
        $payload = $request->validate([
            'title' => ['required', 'string', 'max:190'],
            'authors' => ['nullable', 'string', 'max:190'],
            'venue' => ['nullable', 'string', 'max:190'],
            'publishedAt' => ['nullable', 'date'],
            'link' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'in:draft,submitted,published'],
            'labId' => ['nullable', 'integer', 'exists:research_labs,id'],
        ]);

        $this->authorizeLabOwnership($request, $payload['labId'] ?? null);

        $publication = ResearchPublication::create([
            'owner_id' => $this->ownerId($request),
            'lab_id' => $payload['labId'] ?? null,
            'title' => $payload['title'],
            'authors' => $payload['authors'] ?? null,
            'venue' => $payload['venue'] ?? null,
            'published_at' => $payload['publishedAt'] ?? null,
            'link' => $payload['link'] ?? null,
            'status' => $payload['status'] ?? 'draft',
        ]);

        AuditLogger::log($request, 'researcher.publication.created', 'research_publication', (string) $publication->id, ['title' => $publication->title]);

        return response()->json($this->mapPublication($publication), 201);
    }

    public function updatePublication(Request $request, ResearchPublication $publication)
    {
        $this->authorizeOwner($request, $publication->owner_id);

        $payload = $request->validate([
            'title' => ['sometimes', 'string', 'max:190'],
            'authors' => ['nullable', 'string', 'max:190'],
            'venue' => ['nullable', 'string', 'max:190'],
            'publishedAt' => ['nullable', 'date'],
            'link' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'string', 'in:draft,submitted,published'],
            'labId' => ['nullable', 'integer', 'exists:research_labs,id'],
        ]);

        if (array_key_exists('labId', $payload)) {
            $this->authorizeLabOwnership($request, $payload['labId']);
        }

        $publication->update([
            'title' => $payload['title'] ?? $publication->title,
            'authors' => array_key_exists('authors', $payload) ? $payload['authors'] : $publication->authors,
            'venue' => array_key_exists('venue', $payload) ? $payload['venue'] : $publication->venue,
            'published_at' => array_key_exists('publishedAt', $payload) ? $payload['publishedAt'] : $publication->published_at,
            'link' => array_key_exists('link', $payload) ? $payload['link'] : $publication->link,
            'status' => $payload['status'] ?? $publication->status,
            'lab_id' => array_key_exists('labId', $payload) ? $payload['labId'] : $publication->lab_id,
        ]);

        return response()->json($this->mapPublication($publication));
    }

    public function destroyPublication(Request $request, ResearchPublication $publication)
    {
        $this->authorizeOwner($request, $publication->owner_id);
        $publication->delete();

        return response()->noContent();
    }

    private function ownerId(Request $request): int
    {
        $sessionUser = $request->session()->get('user');

        return is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])
            ? (int) $sessionUser['id']
            : 0;
    }

    private function authorizeOwner(Request $request, int $ownerId): void
    {
        abort_unless($ownerId === $this->ownerId($request), 403, 'Forbidden: you do not own this record.');
    }

    private function authorizeLabOwnership(Request $request, ?int $labId): void
    {
        if ($labId === null) {
            return;
        }

        $lab = ResearchLab::find($labId);
        abort_unless($lab && (int) $lab->owner_id === $this->ownerId($request), 422, 'Selected lab is not available.');
    }

    private function mapLab(ResearchLab $lab): array
    {
        return [
            'id' => $lab->id,
            'title' => $lab->title,
            'description' => $lab->description,
            'focusArea' => $lab->focus_area,
            'status' => $lab->status,
            'collaborators' => $lab->collaborators ?? [],
            'createdAt' => optional($lab->created_at)->toISOString(),
        ];
    }

    private function mapGrant(ResearchGrant $grant): array
    {
        return [
            'id' => $grant->id,
            'labId' => $grant->lab_id,
            'title' => $grant->title,
            'funder' => $grant->funder,
            'amount' => $grant->amount !== null ? (float) $grant->amount : null,
            'currency' => $grant->currency,
            'status' => $grant->status,
            'startDate' => optional($grant->start_date)->toDateString(),
            'endDate' => optional($grant->end_date)->toDateString(),
            'createdAt' => optional($grant->created_at)->toISOString(),
        ];
    }

    private function mapPublication(ResearchPublication $publication): array
    {
        return [
            'id' => $publication->id,
            'labId' => $publication->lab_id,
            'title' => $publication->title,
            'authors' => $publication->authors,
            'venue' => $publication->venue,
            'publishedAt' => optional($publication->published_at)->toDateString(),
            'link' => $publication->link,
            'status' => $publication->status,
            'createdAt' => optional($publication->created_at)->toISOString(),
        ];
    }
}
