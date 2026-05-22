import { ChemistryJsonCourseBuilderClient } from './chemistry-json-course-builder-client';
import { JsonBuilderFullManual } from './json-builder-full-manual';

export function JsonCourseBuilderClient() {
  return (
    <div className="space-y-8">
      <JsonBuilderFullManual />
      <ChemistryJsonCourseBuilderClient />
    </div>
  );
}
