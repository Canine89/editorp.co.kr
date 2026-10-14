/** 작은 화면용 이미지가 실패하면 원본으로 한 번만 복구한다. */
export function installReaderImageFallback() {
  const recover = (image: EventTarget | null) => {
    if (!(image instanceof HTMLImageElement) || !image.closest('.rd-prose figure')) return;
    const original = image.dataset.originalSrc;
    if (!original || image.dataset.imageFallback) return;
    image.dataset.imageFallback = 'true';
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    image.src = original;
  };
  const onError = (event: Event) => recover(event.target);
  document.addEventListener('error', onError, true);
  document.querySelectorAll<HTMLImageElement>('.rd-prose figure img[data-original-src]').forEach((image) => {
    if (image.complete && image.naturalWidth === 0) recover(image);
  });
  return () => document.removeEventListener('error', onError, true);
}
