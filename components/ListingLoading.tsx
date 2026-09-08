export function ListingLoading() {
  return (
    <div
      className="container listing-loading"
      role="status"
      aria-label="목록 불러오는 중"
    >
      <div className="loading-heading" />
      <div className="loading-search" />
      <div className="loading-grid">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} />
        ))}
      </div>
      <span className="sr-only">목록을 불러오는 중입니다…</span>
    </div>
  );
}
