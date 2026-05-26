// src/app/login/employer/page.tsx
import { AuthLoginPage } from '@/components/auth/auth-login-page';

export default function EmployerLoginPage() {
  return (
    <AuthLoginPage
      currentRole="employer"
      title="Employer sign in"
      description="Access your employer dashboard, profile, and opportunities."
      submitLabel="Sign in"
      emailPlaceholder="employer@univai.edu"
      demoCredentials={[{ email: 'employer@univai.edu', password: 'password123' }]}
    />
  );
}
