import { cn } from "@/lib/utils";

/**
 * Marca do LavaCar: uma gota d'água com um carrinho estilizado, sobre o
 * gradiente da marca (índigo → violeta). SVG autossuficiente, renderiza igual
 * em qualquer lugar e reduz bem até o tamanho do favicon.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-9 w-9", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="lcg"
          x1="8"
          y1="2"
          x2="40"
          y2="46"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6366f1" />
          <stop offset="0.55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      {/* gota d'água */}
      <path
        d="M24 3C24 3 9 20 9 30a15 15 0 1 0 30 0C39 20 24 3 24 3Z"
        fill="url(#lcg)"
      />
      {/* carrinho branco no centro da gota */}
      <path
        d="M16 32.5l1.4-4.1a2 2 0 0 1 1.9-1.4h9.4a2 2 0 0 1 1.9 1.4l1.4 4.1"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="15.5" y="32" width="17" height="5" rx="1.6" fill="#fff" />
      <circle cx="19.5" cy="38" r="1.7" fill="url(#lcg)" stroke="#fff" strokeWidth="1.4" />
      <circle cx="28.5" cy="38" r="1.7" fill="url(#lcg)" stroke="#fff" strokeWidth="1.4" />
    </svg>
  );
}
