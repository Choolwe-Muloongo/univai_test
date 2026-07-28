import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: "UnivAI | Africa's AI-Powered University",
  description:
    "Advance your career with AI-powered learning, recognized credentials, research opportunities, and career pathways designed for Africa.",
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
