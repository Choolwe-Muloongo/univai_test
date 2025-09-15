import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <title>UnivAI Logo</title>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 1.7.7 3.2 1.9 4.2" />
      <path d="M18 12v5a2 2 0 0 1-2 2h-1" />
      <path d="M12.5 10.8v.2c0 .5.2.8.6.8s.6-.3.6-.8v-.2" />
      <path d="m9.5 11.8.6.6" />
      <path d="m14 11.8-.6.6" />
      <path d="M12 10.2V8.8" />
      <path d="m11 15-1-1" />
      <path d="m13 15 1-1" />
      <path d="M12 17.5c-1.5 0-2.8-.8-3.5-2" />
    </svg>
  );
}
