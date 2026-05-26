// src/app/login/lecturer/page.tsx
import { AuthLoginPage } from '@/components/auth/auth-login-page';

export default function LecturerLoginPage() {
  return (
    <AuthLoginPage
      currentRole="lecturer"
      loginRole="lecturer"
      title="Lecturer sign in"
      description="Manage modules, sessions, grading, and student progress."
      submitLabel="Continue as Lecturer"
      emailPlaceholder="lecturer@univai.edu"
      allowPrivilegedFallback
      demoCredentials={[{ email: 'lecturer@univai.edu', password: 'password123' }]}
    />
  );
}
