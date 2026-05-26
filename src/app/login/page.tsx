// src/app/login/page.tsx
import { AuthLoginPage } from '@/components/auth/auth-login-page';

export default function LoginPage() {
  return (
    <AuthLoginPage
      currentRole="student"
      title="Welcome back"
      description="Sign in and we’ll take you to the right student dashboard."
      submitLabel="Sign in"
      emailPlaceholder="student@univai.edu"
      showRegisterLink
      demoCredentials={[
        { email: 'student.premium@univai.edu', password: 'password123' },
        { label: 'Applicant', email: 'applicant@univai.edu', password: 'password123' },
      ]}
    />
  );
}
