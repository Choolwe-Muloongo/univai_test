import Image, { type ImageProps } from 'next/image';

import { cn } from '@/lib/utils';

type LogoVariant = 'mark' | 'full';

type LogoProps = Omit<ImageProps, 'src' | 'alt' | 'width' | 'height'> & {
  variant?: LogoVariant;
  alt?: string;
};

const logoSources: Record<LogoVariant, { src: string; width: number; height: number }> = {
  mark: {
    src: '/images/brand/univai-logo-mark-transparent.png',
    width: 560,
    height: 560,
  },
  full: {
    src: '/images/brand/univai-logo-full-transparent.png',
    width: 1040,
    height: 330,
  },
};

export function Logo({ className, variant = 'mark', alt = 'UnivAI', ...props }: LogoProps) {
  const logo = logoSources[variant];

  return (
    <Image
      src={logo.src}
      alt={alt}
      width={logo.width}
      height={logo.height}
      className={cn('shrink-0 object-contain brand-logo-glow', className)}
      {...props}
    />
  );
}

export function WordmarkLogo({ className, ...props }: Omit<LogoProps, 'variant'>) {
  return <Logo variant="full" className={cn('h-12 w-auto', className)} {...props} />;
}
