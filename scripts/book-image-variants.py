"""도서 원본은 보존하고, 작은 화면용 무손실 WebP만 미리 만든다.

사용: python scripts/book-image-variants.py [책-id ...]
필요: pillow. 실행 후 node scripts/book-image-sizes.mjs [책-id ...]
파일 크기가 원본보다 5% 이상 줄어드는 변형만 사용한다.
파일명에 원본 해시를 넣어 배포 후 캐시가 섞이지 않게 한다.
"""
import hashlib
import io
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
WIDTHS = (480, 640, 768)


def variants_for(source, widths=WIDTHS):
    raw = source.read_bytes()
    fingerprint = hashlib.sha256(raw).hexdigest()[:12]
    output = source.parent / 'responsive'
    result = []
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        for width in widths:
            if width >= image.width:
                continue
            height = round(image.height * width / image.width)
            target = output / f'{source.stem}-{fingerprint}-{width}.webp'
            if target.exists():
                encoded = target.read_bytes()
            else:
                small = image.resize((width, height), Image.Resampling.LANCZOS)
                buffer = io.BytesIO()
                small.save(buffer, 'WEBP', lossless=True, method=5, exact=True)
                encoded = buffer.getvalue()
            if len(encoded) >= len(raw) * .95:
                continue
            target.write_bytes(encoded)
            result.append({'src': '/' + str(target.relative_to(ROOT / 'public')),
                           'width': width, 'height': height})
    return '/' + str(source.relative_to(ROOT / 'public')), result, len(raw)


def main():
    if '--articles' in sys.argv:
        for meta in sorted((ROOT / 'content/articles').glob('*/article.json')):
            article = json.loads(meta.read_text())
            cover = article.get('cover')
            if not cover: continue
            source = ROOT / 'public' / cover['src'].lstrip('/')
            (source.parent / 'responsive').mkdir(exist_ok=True)
            _, variants, _ = variants_for(source, (480, 640, 960))
            if variants: cover['variants'] = variants
            meta.write_text(json.dumps(article, ensure_ascii=False, indent=2) + '\n')
            print(f'[{meta.parent.name}] 아티클 표지 무손실 변형 {len(variants)}개', flush=True)
        return
    ids = sys.argv[1:] or [p.name for p in (ROOT / 'content/books').iterdir() if (p / 'book.json').exists()]
    for book_id in ids:
        source_dir = ROOT / 'public/books' / book_id
        if not source_dir.exists():
            continue
        (source_dir / 'responsive').mkdir(exist_ok=True)
        sources = sorted(p for p in source_dir.iterdir() if p.suffix.lower() in ('.webp', '.png', '.jpg', '.jpeg'))
        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(variants_for, sources))
        manifest = {src: variants for src, variants, _ in results if variants}
        destination = ROOT / 'content/books' / book_id / 'image-variants.json'
        destination.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
        count = sum(len(v) for v in manifest.values())
        print(f'[{book_id}] 원본 {len(sources)}개 보존 / 무손실 변형 {count}개 ({len(manifest)}개 이미지)', flush=True)


if __name__ == '__main__':
    main()
