"""공유 미리보기(Open Graph) 이미지 생성기

설치: pip install pillow
사용: python scripts/make-og-images.py

카카오톡·페이스북 등은 og:image가 작으면(200px 미만) 무시하거나 잘라 보여준다.
1200×630 흰 바탕 JPG를 만든다.
 - public/og/site.jpg          : 사이트 기본 (편집자P 캐릭터 + 사이트 이름)
 - public/og/<책-id>.jpg       : 무료 도서마다 (표지 + 제목·부제, 일부 공개면 공개 범위)
새 책을 올리거나 표지·제목이 바뀌면 다시 실행한다. 글자는 사이트 글꼴(EditorP Sans)로 쓴다.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/og'
OUT.mkdir(parents=True, exist_ok=True)
FONT = str(ROOT / 'public/fonts/EditorPSans.woff2')
W, H = 1200, 630
INK, BODY, MUTED, NAVY, YELLOW, RULE = (14, 23, 51), (42, 49, 66), (93, 101, 119), (31, 66, 146), (238, 169, 59), (227, 230, 237)


# 부분 글꼴에 없는 글자(예: 저자 이름)가 있으면 그 줄만 운영체제의 한글 글꼴로 쓴다 (macOS: Apple SD 산돌고딕 Neo)
FALLBACK = '/System/Library/Fonts/AppleSDGothicNeo.ttc'


def font(size, weight):
    f = ImageFont.truetype(FONT, size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    f.size_weight = (size, weight)
    return f


def font_for(text, f):
    if not missing(text, f):
        return f
    try:
        size, weight = f.size_weight
        return ImageFont.truetype(FALLBACK, size, index=6 if weight >= 650 else 4 if weight >= 520 else 2)
    except OSError:
        print(f'  ! 글꼴에 없는 글자 {missing(text, f)}: 대체 글꼴도 없어 빈칸으로 나옵니다')
        return f


def text(d, xy, t, f, fill):
    d.text(xy, t, font=font_for(t, f), fill=fill)


def missing(text, f):
    """부분 글꼴에 없는 글자(두부 □로 나오는 글자)를 찾는다"""
    tofu = f.getmask('\U000F0000').getbbox()
    return sorted({ch for ch in text if not ch.isspace() and f.getmask(ch).getbbox() == tofu})


def wrap(draw, text, f, width):
    """한국어는 어절 단위로 줄바꿈"""
    lines, cur = [], ''
    for word in text.split(' '):
        test = (cur + ' ' + word).strip()
        if draw.textlength(test, font=f) <= width or not cur:
            cur = test
        else:
            lines.append(cur); cur = word
    if cur: lines.append(cur)
    return lines


def base():
    im = Image.new('RGB', (W, H), 'white')
    d = ImageDraw.Draw(im)
    d.rectangle([0, H - 14, W, H], fill=NAVY)          # 아래 남색 띠
    d.rectangle([0, H - 14, 220, H], fill=YELLOW)      # 노랑 포인트
    return im, d


def paste_shadowed(im, img, xy):
    x, y = xy
    shadow = Image.new('RGBA', (img.width + 40, img.height + 40), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rectangle([20, 26, img.width + 20, img.height + 26], fill=(14, 23, 51, 70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(12))
    im.paste(shadow, (x - 20, y - 20), shadow)
    im.paste(img, (x, y))


def book_image(book_id, book):
    im, d = base()
    cover = Image.open(ROOT / 'public' / book['cover'].lstrip('/')).convert('RGB')
    ch = 500
    cover = cover.resize((round(cover.width * ch / cover.height), ch), Image.LANCZOS)
    paste_shadowed(im, cover, (90, 52))
    x = 90 + cover.width + 70
    width = W - x - 70
    kicker, f_title, f_sub, f_meta = font(26, 600), font(56, 750), font(30, 500), font(26, 500)
    y = 96
    text(d, (x, y), '편집자P의 AI 서재 · 무료로 읽기', kicker, NAVY); y += 58
    for line in wrap(d, book['title'], font_for(book['title'], f_title), width)[:3]:
        text(d, (x, y), line, f_title, INK); y += 70
    if book.get('subtitle'):
        y += 6
        for line in wrap(d, book['subtitle'], font_for(book['subtitle'], f_sub), width)[:2]:
            text(d, (x, y), line, f_sub, BODY); y += 42
    y += 22
    meta = '앞부분 약 35% 무료 공개' if book.get('preview') else '전체 무료 공개'
    tw = d.textlength(meta, font=font_for(meta, f_meta))
    d.rectangle([x - 4, y + 18, x + tw + 4, y + 34], fill=(247, 221, 176))   # 형광펜
    text(d, (x, y), meta, f_meta, INK)
    text(d, (x, y + 44), book.get('author', ''), f_meta, MUTED)
    im.save(OUT / f'{book_id}.jpg', quality=88, optimize=True, progressive=True)
    print(f'[{book_id}] public/og/{book_id}.jpg')


def site_image():
    im, d = base()
    manifest = json.loads((ROOT / 'public/character/manifest.json').read_text())
    char = Image.open(ROOT / 'public/character/hero-wave.webp').convert('RGBA')
    ch = 400
    char = char.resize((round(char.width * ch / char.height), ch), Image.LANCZOS)
    im.paste(char, (W - char.width - 90, H - 14 - ch), char)
    x, y = 90, 150
    text(d, (x, y), '편집자P의 AI 서재', font(76, 780), INK); y += 110
    text(d, (x, y), 'IT 책을 만드는 편집자 박현규', font(34, 520), BODY); y += 70
    f_meta = font(30, 560)
    for t in ('AI 강의 로드맵', '무료로 읽는 책', '강의 이력'):
        text(d, (x, y), t, f_meta, NAVY); y += 46
    assert 'hero-wave' in manifest
    im.save(OUT / 'site.jpg', quality=88, optimize=True, progressive=True)
    print('[site] public/og/site.jpg')


if __name__ == '__main__':
    site_image()
    for book_json in sorted((ROOT / 'content/books').glob('*/book.json')):
        book = json.loads(book_json.read_text())
        if book.get('cover') and book.get('isPublished', True):
            book_image(book_json.parent.name, book)
