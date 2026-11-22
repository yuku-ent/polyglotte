import { cx } from "./ui";

/**
 * Logo Polyglotte : « Le fil ».
 * Un P tracé d'un seul trait qui ne se referme pas, comme un parcours qui continue.
 * Construit sur une grille de 256 : fût de 30, boucle de rayon 60/58, terminaison ouverte.
 */
export const LOGO_PATH = "M90 212V104a60 60 0 0 1 60-60a58 58 0 0 1 2 116h-4";

export function LogoMark({
  className,
  animated = false,
  title = "Polyglotte",
}: {
  className?: string;
  animated?: boolean;
  title?: string;
}) {
  return (
    <svg viewBox="0 0 256 256" className={className} role="img" aria-label={title}>
      <path
        d={LOGO_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={30}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        className={cx(animated && "logo-draw")}
      />
    </svg>
  );
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5", className)}>
      <LogoMark className={cx("h-8 w-8 text-[var(--accent)]", markClassName)} />
      <span className="text-xl font-extrabold tracking-[-0.04em] text-stone-900">polyglotte</span>
    </span>
  );
}
