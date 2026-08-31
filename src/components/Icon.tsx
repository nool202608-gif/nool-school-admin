import type { SVGProps } from 'react';

/** Inline line icons for buttons/actions across the app - stroke-based,
 * 16px, dependency-free (matches Sidebar's own Icon convention) rather
 * than pulling in an icon library for a couple dozen glyphs. */
function Base({ children, ...props }: SVGProps<SVGSVGElement> & { children: React.ReactNode }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export const PlusIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const UploadIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M12 16V4M6 10l6-6 6 6" />
    <path d="M4 18v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
  </Base>
);

export const DownloadIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M12 4v12M6 10l6 6 6-6" />
    <path d="M4 18v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
  </Base>
);

export const TrashIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V4.8c0-.4.4-.8.9-.8h4.2c.5 0 .9.4.9.8V7" />
    <path d="M6 7l1 13c0 1 .8 1.7 1.8 1.7h6.4c1 0 1.8-.7 1.8-1.7L18 7" />
    <path d="M10 11v6M14 11v6" />
  </Base>
);

export const BanIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M5.5 5.5l13 13" />
  </Base>
);

export const CheckCircleIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.3 2.3L16 10" />
  </Base>
);

export const EditIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
    <path d="M13.5 6.5l4 4" />
  </Base>
);

export const KeyIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <circle cx="8" cy="15" r="4" />
    <path d="M11 12l8-8" />
    <path d="M16 7l2 2M19 4l2 2" />
  </Base>
);

export const MailIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3.5 6.5L12 13l8.5-6.5" />
  </Base>
);

export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Base>
);

export const ClassIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="14" rx="1.5" />
    <path d="M3 9h18" />
  </Base>
);

export const BookIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M4 5.5A2 2 0 0 1 6 4h13v14H6a2 2 0 0 0-2 2V5.5Z" />
    <path d="M8 8h7" />
  </Base>
);

export const UsersIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20c0-3 2.5-5.3 5.5-5.3s5.5 2.3 5.5 5.3" />
    <circle cx="17" cy="9" r="2.6" />
    <path d="M15.5 14.3c2.3.3 4 2 4 4.5" />
  </Base>
);

export const TrendingUpIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </Base>
);

export const AlertIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M12 3.5L2.5 20h19L12 3.5Z" />
    <path d="M12 10v4.5" />
    <circle cx="12" cy="17.3" r="0.6" fill="currentColor" />
  </Base>
);

export const SparkleIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
  </Base>
);

export const BellIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M6 8.5a6 6 0 1 1 12 0c0 4.2 1.5 5.7 2 6.5H4c.5-.8 2-2.3 2-6.5Z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </Base>
);

export const XIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Base>
);
