// src/app/login/instructor/page.tsx
import { AuthLoginPage } from '@/components/auth/auth-login-page';

export default function InstructorLoginPage() {
  return (
    <AuthLoginPage
      currentRole="instructor"
      loginRole="instructor"
      title="Instructor sign in"
      description="Manage your courses, learners, content, and teaching tools."
      submitLabel="Continue as Instructor"
      emailPlaceholder="instructor@univai.edu"
      allowPrivilegedFallback
      demoCredentials={[{ email: 'instructor@univai.edu', password: 'password123' }]}
    />
  );
}
