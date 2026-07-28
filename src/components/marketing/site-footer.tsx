import Link from 'next/link';
import { Facebook, Linkedin, Mail, MessageCircle, Send, Youtube } from 'lucide-react';

import { Logo } from '@/components/icons/logo';
import { UNIVAI_WHATSAPP_CHANNEL_URL } from '@/components/auth/whatsapp-channel-requirement';

const exploreLinks = [
  { href: '/programs', label: 'Programs' },
  { href: '/#schools', label: 'Schools' },
  { href: '/#why-univai', label: 'AI Learning' },
  { href: '/#research', label: 'Research' },
  { href: '/#opportunities', label: 'Careers' },
  { href: '/contact', label: 'Support' },
];

const portalLinks = [
  { href: '/login', label: 'Student Login' },
  { href: '/login/lecturer', label: 'Lecturer Login' },
  { href: '/login/researcher', label: 'Researcher Login' },
  { href: '/login/instructor', label: 'Instructor Login' },
  { href: '/login/employer', label: 'Employer Login' },
  { href: '/login/admin', label: 'Admin Login' },
];

const communityLinks = [
  { href: UNIVAI_WHATSAPP_CHANNEL_URL, label: 'WhatsApp Channel', icon: MessageCircle },
  { href: '#', label: 'Telegram Community', icon: Send },
  { href: '#', label: 'Facebook', icon: Facebook },
  { href: '#', label: 'LinkedIn', icon: Linkedin },
  { href: '#', label: 'YouTube', icon: Youtube },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-black/5 bg-brand-dark py-14 text-white/80 dark:border-white/10">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="flex flex-col items-start gap-4">
          <div className="flex items-center gap-2">
            <Logo className="size-10 rounded-xl brand-logo-glow" />
            <span className="text-xl font-extrabold text-white">UnivAI</span>
          </div>
          <p className="max-w-xs text-sm text-white/60">
            World-class education, career opportunities, and AI-powered learning for every African.
          </p>
          <a href="mailto:support@univai.aftacoin.biz" className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
            <Mail className="h-4 w-4" />
            support@univai.aftacoin.biz
          </a>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white/50">Explore</h4>
          {exploreLinks.map((link) => (
            <Link key={link.label} href={link.href} className="text-sm text-white/70 hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white/50">Portals</h4>
          {portalLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-white/70 hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white/50">Community</h4>
          <div className="flex flex-wrap gap-2">
            {communityLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
                title={link.label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-brand-green hover:text-brand-green"
              >
                <link.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 flex w-full max-w-6xl flex-col gap-3 border-t border-white/10 px-4 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>&copy; {new Date().getFullYear()} UnivAI. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/policies" className="hover:text-white">Policies</Link>
        </div>
      </div>
    </footer>
  );
}
