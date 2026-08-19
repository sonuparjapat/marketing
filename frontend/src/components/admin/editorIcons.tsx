type IconProps = { size?: number };

const base = (size = 16) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const BoldIcon = ({ size }: IconProps) => (
  <svg {...base(size)}>
    <path d="M6 4h6a3.5 3.5 0 010 7H6zM6 11h7a3.5 3.5 0 010 7H6z" />
  </svg>
);

export const ItalicIcon = ({ size }: IconProps) => (
  <svg {...base(size)}>
    <path d="M10 4h6M4 20h6M14 4L8 20" strokeWidth="1.8" />
  </svg>
);

export const UnderlineIcon = ({ size }: IconProps) => (
  <svg {...base(size)}>
    <path d="M6 4v6a6 6 0 0012 0V4M4 20h16" strokeWidth="1.8" />
  </svg>
);

export const StrikeIcon = ({ size }: IconProps) => (
  <svg {...base(size)}>
    <path d="M6 12h12M8 6.5c0-1.4 1.8-2.5 4-2.5s4 1 4 2.5-1.5 2-4 2.5M16 17.5c0 1.4-1.8 2.5-4 2.5s-4-1.1-4-2.7" strokeWidth="1.8" />
  </svg>
);

export const HighlightIcon = ({ size }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 20h16M9 15l-3.5 3.5L4 17l7-7M9 15l6-6M15 9l-3-3 3-3 3 3z" strokeWidth="1.6" />
  </svg>
);

export const H1Icon = ({ size }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 5v14M12 5v14M4 12h8M17 8l3-2v10" strokeWidth="1.8" />
  </svg>
);

export const H2Icon = ({ size }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 5v14M12 5v14M4 12h8M16 9a2.5 2.5 0 015 0c0 2-5 3-5 6h5" strokeWidth="1.6" />
  </svg>
);

export const H3Icon = ({ size }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 5v14M12 5v14M4 12h8M16.5 8.5A2.2 2.2 0 0119 7a2 2 0 010 4 2 2 0 010 4 2.2 2.2 0 01-2.5-1.5" strokeWidth="1.6" />
  </svg>
);

export const QuoteIcon = ({ size }: IconProps) => (
  <svg {...base(size)}>
    <path d="M7 8c-2 0-3 1.5-3 3.5S5 15 7 15v-2c-1 0-1.5-.5-1.5-1.5S6 10 7 10zM17 8c-2 0-3 1.5-3 3.5s1 3.5 3 3.5v-2c-1 0-1.5-.5-1.5-1.5S16 10 17 10z" strokeWidth="1.4" fill="currentColor" />
  </svg>
);

export const CodeIcon = ({ size }: IconProps) => (
  <svg {...base(size)}>
    <path d="M9 8l-5 4 5 4M15 8l5 4-5 4" strokeWidth="1.8" />
  </svg>
);

export const CodeBlockIcon = ({ size }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="1.6" />
    <path d="M9 10l-2 2 2 2M15 10l2 2-2 2" strokeWidth="1.6" />
  </svg>
);

export const BulletListIcon = ({ size }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
    <path d="M9 6h11M9 12h11M9 18h11" strokeWidth="1.8" />
  </svg>
);

export const OrderedListIcon = ({ size }: IconProps) => (
  <svg {...base(size)}>
    <path d="M9 6h11M9 12h11M9 18h11" strokeWidth="1.8" />
    <text x="2" y="8" fontSize="7" fill="currentColor" stroke="none">1</text>
    <text x="2" y="14.5" fontSize="7" fill="currentColor" stroke="none">2</text>
    <text x="2" y="21" fontSize="7" fill="currentColor" stroke="none">3</text>
  </svg>
);

export const HrIcon = ({ size }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 12h16" strokeWidth="2.2" />
  </svg>
);

export const LinkIcon = ({ size }: IconProps) => (
  <svg {...base(size)}>
    <path d="M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1.5 1.5M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1.5-1.5" strokeWidth="1.7" />
  </svg>
);

export const ImageIcon2 = ({ size }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="1.6" />
    <circle cx="8.5" cy="9.5" r="1.5" strokeWidth="1.4" />
    <path d="M21 16l-5.5-5.5L4 21" strokeWidth="1.6" />
  </svg>
);

export const UndoIcon = ({ size }: IconProps) => (
  <svg {...base(size)}>
    <path d="M7 8H3V4M3 8a9 9 0 1013-3.7" strokeWidth="1.7" />
  </svg>
);

export const RedoIcon = ({ size }: IconProps) => (
  <svg {...base(size)}>
    <path d="M17 8h4V4M21 8A9 9 0 108 4.3" strokeWidth="1.7" />
  </svg>
);
