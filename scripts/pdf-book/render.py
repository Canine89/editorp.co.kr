"""외부 렌더링을 사용하는 책의 PDF 쪽 이미지를 병렬로 준비한다.

사용법: python scripts/pdf-book/render.py scripts/pdf-book/books/python-intro.json
필요: pip install pymupdf
이후 extract.py, assemble.py, node scripts/book-image-sizes.mjs <책-id> 순으로 실행한다.
원본 PDF는 설정의 pdf 경로에 두고, 생성되는 중간 파일은 /tmp/pdf-book에만 저장한다.
"""
import json
import os
import sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import pymupdf


def render_page(args):
    pdf, work, n = args
    target = Path(work) / 'hi' / f'p-{n:03d}.png'
    if not target.exists():
        with pymupdf.open(pdf) as doc:
            # pdftohtml 좌표는 108dpi. extract.py의 S=2에 맞춰 216dpi로 렌더링한다.
            doc[n - 1].get_pixmap(matrix=pymupdf.Matrix(3, 3), alpha=False).save(target)
    return n


def main():
    config = json.loads(Path(sys.argv[1]).read_text())
    root = Path(__file__).resolve().parents[2]
    pdf = os.environ.get('PDF_BOOK_SOURCE') or os.path.join(root, config['pdf'])
    work = f"/tmp/pdf-book/{config['id']}"
    Path(work, 'hi').mkdir(parents=True, exist_ok=True)
    first, last = config['pages']
    with ProcessPoolExecutor(max_workers=config.get('workers', 4)) as pool:
        for count, _ in enumerate(pool.map(render_page, ((pdf, work, n) for n in range(first, last + 1))), 1):
            if count % 50 == 0 or count == last - first + 1:
                print(f'{count}/{last - first + 1}쪽 렌더링', flush=True)


if __name__ == '__main__':
    main()
