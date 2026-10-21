"use client";

export type SortKey = "featured" | "price-asc" | "price-desc" | "name";

interface TopBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  resultCount: number;
}

export function TopBar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  resultCount,
}: TopBarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search products..."
        className="w-full max-w-sm rounded-card border border-line bg-surface px-3 py-2 text-[14px] text-ink placeholder:text-steel focus:border-ink focus:outline-none"
      />
      <div className="flex items-center gap-4">
        <span className="text-[13px] text-steel">{resultCount} results</span>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="rounded-card border border-line bg-surface px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>
    </div>
  );
}