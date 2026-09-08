"use client";
import { useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import styles from "./SearchFilters.module.css";
interface Filter {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
}
export function SearchFilters({
  action,
  query,
  filters,
  hidden = {},
  placeholder = "검색어를 입력하세요…",
}: {
  action: string;
  query: string;
  filters: Filter[];
  hidden?: Record<string, string>;
  placeholder?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const submitted = useRef(false);
  useEffect(() => {
    if (!pending && submitted.current) {
      document
        .getElementById("search-results-status")
        ?.focus({ preventScroll: true });
      submitted.current = false;
    }
  }, [pending]);
  return (
    <form
      action={action}
      role="search"
      className={styles.form}
      aria-busy={pending}
      onSubmit={(e) => {
        e.preventDefault();
        submitted.current = true;
        const data = new FormData(e.currentTarget);
        const params = new URLSearchParams();
        data.forEach((value, key) => {
          if (typeof value === "string" && value.trim())
            params.set(key, value.trim());
        });
        startTransition(() =>
          router.push(`${action}?${params.toString()}`, { scroll: false }),
        );
      }}
    >
      {Object.entries(hidden).map(([name, value]) => (
        <input type="hidden" name={name} value={value} key={name} />
      ))}
      <label className={styles.search}>
        <span>검색어</span>
        <div>
          <Search size={18} aria-hidden="true" />
          <input
            key={query}
            type="search"
            id={action === "/videos" ? "video-search" : "book-query"}
            name="q"
            defaultValue={query}
            placeholder={placeholder}
            autoComplete="off"
          />
        </div>
      </label>
      {filters.map((filter) => (
        <label className={styles.select} key={filter.name}>
          <span>{filter.label}</span>
          <select
            key={filter.value}
            name={filter.name}
            defaultValue={filter.value}
          >
            {filter.options.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "찾는 중…" : "검색"}
      </button>
      <span className="sr-only" role="status">
        {pending ? "검색 결과를 불러오고 있습니다." : ""}
      </span>
    </form>
  );
}
