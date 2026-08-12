import type { ReactNode } from "react";

type ModuleHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
};

export function ModuleHeader({ eyebrow, title, description, aside }: ModuleHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-4 border-b border-border pb-7 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      </div>
      {aside}
    </header>
  );
}
