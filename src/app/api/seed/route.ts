export async function POST() {
  return Response.json(
    {
      message: 'Seeding is disabled in frontend-only mode.',
      status: 'skipped',
    },
    { status: 200 }
  );
}
