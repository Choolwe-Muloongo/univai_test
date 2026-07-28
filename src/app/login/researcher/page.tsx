// src/app/login/researcher/page.tsx
import { AuthLoginPage } from '@/components/auth/auth-login-page';

export default function ResearcherLoginPage() {
  return (
    <AuthLoginPage
      currentRole="researcher"
      loginRole="researcher"
      title="Researcher sign in"
      description="Access your research portal to manage collaborations and projects."
      submitLabel="Continue as Researcher"
      emailPlaceholder="researcher@univai.edu"
      allowPrivilegedFallback
      demoCredentials={[{ email: 'researcher@univai.edu', password: 'password123' }]}
    />
  );
}
