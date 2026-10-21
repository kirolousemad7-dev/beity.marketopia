"use client";

import { Category } from "@/lib/types";

interface SidebarProps {
  categories: Category[];
  counts: Record<string, number>;
  active: string;
  onSelect: (slug: string) => void;
  className?: string;
}

export function Sidebar({
  categories,
  counts,
  active,
  onSelect,
  className = "",
}: SidebarProps) {
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <nav className={`flex flex-col gap-0.5 ${className}`}>
      <CategoryButton
        label="All products"
        count={totalCount}
        active={active === "all"}
        onClick={() => onSelect("all")}
      />
      {categories.map((c) => (
        <CategoryButton
          key={c.slug}
          label={c.name}
          count={counts[c.slug] ?? 0}
          active={active === c.slug}
          onClick={() => onSelect(c.slug)}
        />
      ))}
    </nav>
  );
}

function CategoryButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-shrink-0 items-center justify-between gap-3 whitespace-nowrap rounded-card px-3 py-2 text-left text-[14px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-volt ${
        active ? "bg-ink text-surface" : "text-ink/80 hover:bg-white"
      }`}
    >
      <span>{label}</span>
      <span className={active ? "text-surface/70" : "text-steel"}>
        {count}
      </span>
    </button>
  );
}