import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'UnivAI',
  description: 'The future of global higher education, powered by AI.',
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
