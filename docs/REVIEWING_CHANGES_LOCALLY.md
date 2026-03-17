# Reviewing Changes Locally

If GitHub comments are hard to follow, you can review every change directly from your terminal.

## Quick commands

```bash
git log --oneline -n 5
git show --stat d8636df
git show d8636df
```

## Focused file-by-file review

```bash
git show d8636df -- backend2.0/app/Http/Controllers/Api/GradesController.php
git show d8636df -- src/app/admin/curriculum/page.tsx
git show d8636df -- src/app/admin/dashboard/page.tsx
```

## Side-by-side compare against previous commit

```bash
git diff 3fd8300..d8636df -- backend2.0 src
```

## What changed in that commit (high level)

- Added `code` and `hours_per_week` support for program modules in backend model/controller and frontend types/forms.
- Added admin pages for curriculum operations and blueprint reference.
- Updated grading flow so lecturer saves default to `draft`, and draft attempts are updated rather than duplicated.
- Limited student assignment views to `published` items.

