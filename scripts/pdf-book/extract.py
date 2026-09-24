"""인쇄용 PDF(InDesign) → 무료 도서 1단계: 쪽마다 글 조각의 역할과 그림 영역을 찾는다.

사용법: python scripts/pdf-book/extract.py scripts/pdf-book/books/<책-id>.json
필요: poppler(pdftohtml, pdftoppm), pip install pillow numpy

- pdftohtml -xml 로 글 조각(글꼴·크기·색·위치)을, pdftoppm 216dpi로 쪽 이미지를 만든다.
- 글꼴 조합으로 역할(본문·제목·NOTE·프롬프트·1:1 코칭·요약·곁단 등)을 정한다.
  역할표(role_of)는 골든래빗 '바로바로' 시리즈 판면 기준이다. 다른 판면이면 여기를 고친다.
- 흐름 글자를 지운 나머지 잉크 덩어리를 그림으로 본다(말풍선·화살표가 붙은 스크린샷도 한 장으로).
출력(작업 폴더 /tmp/pdf-book/<책-id>): pages/pNNN.json, debug/pNNN.png(검출 상자 표시)
"""
import re, html, json, sys, os, subprocess
from collections import deque
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CFG = json.load(open(sys.argv[1]))
WORK = f"/tmp/pdf-book/{CFG['id']}"
PDF = os.path.join(ROOT, CFG['pdf'])
FIRST, LAST = CFG['pages']
XML = f'{WORK}/all.xml'
HI = WORK + '/hi/p-{:03d}.png'
OUT = f'{WORK}/pages'; DBG = f'{WORK}/debug'
for d in (OUT, DBG, f'{WORK}/hi'): os.makedirs(d, exist_ok=True)
if not os.path.exists(XML):
    subprocess.run(['pdftohtml', '-xml', '-f', '1', '-l', str(LAST), '-i', '-nodrm', '-q', PDF, XML[:-4]], check=True)
if not os.path.exists(HI.format(LAST)):
    subprocess.run(['pdftoppm', '-f', str(FIRST), '-l', str(LAST), '-r', '216', '-png', PDF, f'{WORK}/hi/p'], check=True)
S = 2  # 렌더 배율 (XML 좌표 × 2)
TOP_CUT, BOTTOM_CUT = 105, 1065  # 머리글·바닥글 제외

src = open(XML, encoding='utf-8').read()
fonts = {m.group(1): (m.group(3).split('+')[-1], int(m.group(2)), m.group(4).lower())
         for m in re.finditer(r'<fontspec id="(\d+)" size="(-?\d+)" family="([^"]+)" color="([^"]+)"/>', src)}
pages = {int(m.group(1)): m.group(2) for m in re.finditer(r'<page number="(\d+)"[^>]*>(.*?)</page>', src, re.S)}

INK, WHITE = '#231f20', '#ffffff'


def is_accent(color):
    """강조색(초록·파랑·분홍 등 채도 높은 색). 책마다 강조색이 달라 색을 고정하지 않는다"""
    try:
        r, g, b = (int(color[i:i + 2], 16) for i in (1, 3, 5))
    except ValueError:
        return False
    return max(r, g, b) - min(r, g, b) > 60 and color not in (INK, WHITE)


def rule_match(rule, fam, size, color, text):
    font = rule['font']
    if not (fam.startswith(font[:-1]) if font.endswith('*') else fam == font): return False
    if rule.get('size', '*') != '*' and rule['size'] != size: return False
    c = rule.get('color', '*')
    if c == 'accent' and not is_accent(color): return False
    if c not in ('*', 'accent') and c.lower() != color: return False
    if rule.get('text') and not re.fullmatch(rule['text'], text.strip()): return False
    return True


def role_of(fam, size, color, text):
    # 책별 설정의 역할표가 먼저 (같은 글꼴이 책마다 다른 뜻으로 쓰인다)
    for rule in CFG.get('roles', []):
        if rule_match(rule, fam, size, color, text): return rule['role']
    f = fam
    accent = is_accent(color)
    if size >= 14 and re.fullmatch(r'\s*[①-⑳❶-❿➀-➓]\s*', text): return 'body'     # 본문 속 원문자 (그림 속이면 그림에 남는다)
    if f.startswith('D2Coding'): return 'code'
    if f.startswith('KoPubWorldBatang') and size == 15: return 'body'
    if f == 'NotoSansKR' and size == 14 and color == INK: return 'body'        # 본문 속 굵은 말
    if f.startswith('NotoSansCJKkr') and size == 17: return 'body'
    if f.startswith('KoPubDotum') and size == 9: return 'annot'                # 영문 병기
    if f == 'NotoSansKR-Black' and size == 21: return 'h2'
    if f == 'NotoSansKR-Black' and size == 20 and accent: return 'h2'           # 앞부분 Q&A 제목
    if f.startswith('UniversNext') and re.fullmatch(r'Q\d+', text.strip()): return 'qnum'
    if f == 'NotoSansKR' and size == 17 and color == INK: return 'h3'
    if f == 'NotoSansKR' and size == 15 and accent: return 'h4'
    if f.startswith('SLEIGothic') and size == 15 and accent: return 'step'
    if f == 'NotoSansKR' and size == 14 and accent:
        return 'step' if re.fullmatch(r'\s*\d{2}\s*', text) else 'label'
    if f.startswith('SLEIGothic') and size == 14 and accent: return 'label'
    if f.startswith('KCC-Ganpan') and color == WHITE: return 'note_label'
    if f == 'NotoSansKR' and size == 10 and accent: return 'box_label'   # 프롬프트 / AI
    if f.startswith('NotoSansCJKkr') and size == 14 and color == INK: return 'box_text'
    if f == 'NotoSansKR' and size == 14 and color == WHITE: return 'coach_title'
    if f.startswith('NotoSansKR-Medium') and size <= 10 and color == WHITE: return 'kbd'   # 키보드 키 모양
    if f.startswith('GoodNeighbor') and size == 14 and color == WHITE:
        return 'coach_tag' if '코칭' in text else 'tag'                            # PC / 모바일
    if f.startswith('GoodNeighbor') and size in (12, 13) and color == WHITE:
        return 'quiz_label' if '퀴즈' in text else 'ex_label'                      # 바로 01 / 잠깐 퀴즈
    if f.startswith('GoodNeighbor') and size == 17 and color == WHITE:
        return 'summary_label' if '요약' in text else 'decor'
    if f.startswith('Gangwon') and size == 18: return 'summary'
    if f == 'NotoSansKR-Black' and size == 29 and color == WHITE: return 'sec_title'
    if f.startswith('UniversNext'): return 'decor'
    if f.startswith('NelnaLizzy'): return 'decor'
    if f.startswith('SLEIGothic') and size == 11: return 'decor'
    if f == 'NotoSansKR-Black' and size == 14: return 'side_title'
    if f == 'NotoSansKR-Medium' and size == 14 and color == INK: return 'side_text'
    if f in ('NotoSansKR-Medium', 'NotoSansKR') and size == 11 and color == '#a7a5a5': return 'side_text'
    if f.startswith('NotoSansKR-Light') and size in (12,) or f.startswith('NotoSansCJKkr-Light') and size == 12: return 'small'
    return 'fig'   # 그림 속 글자(말풍선·표·일러스트)로 추정

FLOW = {'qnum', 'code', 'kbd', 'quiz_label', 'quiz_answer', 'body', 'annot', 'h2', 'h3', 'h4', 'step', 'label', 'note_label', 'box_label', 'box_text',
        'coach_title', 'coach_tag', 'tag', 'ex_label', 'summary_label', 'summary', 'sec_title',
        'side_title', 'side_text', 'small'}
DECOR_IN_BOX = {'quiz_label', 'sec_title', 'ex_label', 'coach_title', 'coach_tag', 'tag', 'note_label', 'summary_label', 'decor', 'box_label', 'side_title'}

def runs_of(n):
    out = []
    for t in re.finditer(r'<text top="(\d+)" left="(\d+)" width="(\d+)" height="(\d+)" font="(\d+)">(.*?)</text>', pages[n]):
        raw = t.group(6)
        txt = html.unescape(re.sub(r'<[^>]+>', '', raw))
        if not txt.strip(): continue
        top, left, w, h = map(int, t.group(1, 2, 3, 4))
        if top < TOP_CUT or top > BOTTOM_CUT: continue
        fam, size, color = fonts[t.group(5)]
        out.append(dict(top=top, left=left, bottom=top + h, right=left + w, text=txt, bold='<b>' in raw,
                        role=role_of(fam, size, color, txt), font=f'{fam}/{size}/{color}'))
    return out

def figures(n, runs):
    """글을 지운 잉크 영역의 연결 성분 → 그림 후보"""
    im = Image.open(HI.format(n)).convert('RGB')
    a = np.asarray(im).astype(np.int32)
    lum = (a[..., 0] * 299 + a[..., 1] * 587 + a[..., 2] * 114) // 1000
    sat = a.max(-1) - a.min(-1)
    ink = (lum < 215) | ((sat > 60) & (lum < 235))
    H, W = ink.shape
    ink[: TOP_CUT * S, :] = False; ink[BOTTOM_CUT * S:, :] = False
    ink[:, : 95 * S] = False; ink[:, 815 * S:] = False
    for r in runs:   # 흐름 글자는 지운다 (그림 속 글자는 남겨 그림에 붙게)
        if r['role'] in FLOW:
            ink[max(0, (r['top'] - 2) * S):(r['bottom'] + 2) * S, max(0, (r['left'] - 2) * S):(r['right'] + 2) * S] = False
    # 4px 격자로 줄여 연결 성분 찾기 (8칸 팽창)
    g = 4
    small = ink[: H // g * g, : W // g * g].reshape(H // g, g, W // g, g).any(axis=(1, 3))
    dil = np.array(Image.fromarray(small.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(9))) > 0
    seen = np.zeros_like(dil); comps = []
    for y, x in zip(*np.nonzero(dil)):
        if seen[y, x]: continue
        q = deque([(y, x)]); seen[y, x] = True; y0 = y1 = y; x0 = x1 = x; cnt = 0
        while q:
            cy, cx = q.popleft(); cnt += 1
            y0, y1, x0, x1 = min(y0, cy), max(y1, cy), min(x0, cx), max(x1, cx)
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < dil.shape[0] and 0 <= nx < dil.shape[1] and dil[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; q.append((ny, nx))
        # 팽창분(4칸) 되돌려 XML 좌표로
        bx0, by0 = (x0 + 4) * g / S, (y0 + 4) * g / S
        bx1, by1 = (x1 - 3) * g / S, (y1 - 3) * g / S
        comps.append([bx0, by0, bx1, by1, cnt])
    figs = []
    for x0, y0, x1, y1, cnt in comps:
        w, h = x1 - x0, y1 - y0
        if w < 70 or h < 45 or w * h < 7000: continue
        if w < 110 and h < 130: continue                      # 토끼 마스코트 같은 작은 장식
        if y0 < 180 and h < 70 and w > 500: continue          # 앞부분 쪽 머리의 제목 띠
        inside = [r for r in runs if x0 - 4 <= (r['left'] + r['right']) / 2 <= x1 + 4 and y0 - 4 <= (r['top'] + r['bottom']) / 2 <= y1 + 4]
        deco = [r for r in inside if r['role'] in DECOR_IN_BOX]
        flow = [r for r in inside if r['role'] in ('body', 'h2', 'h3', 'box_text', 'summary', 'small', 'side_text')]
        # 장식 띠(절 제목 배너·바로 NN 알약·코칭 머리띠 등): 흰 글씨 장식이 있고 그림 글자가 거의 없으면 버린다
        if deco and len([r for r in inside if r['role'] == 'fig']) < 2 and h < 160: continue
        if any(r['role'] == 'sec_title' for r in inside): continue
        # 워밍업 곁단(토끼·'미리 알아두세요')은 그림이 아니다
        if any(r['role'] in ('side_title', 'side_text') for r in inside) and len([r for r in inside if r['role'] == 'fig']) < 2: continue
        figs.append(dict(left=round(x0), top=round(y0), right=round(x1), bottom=round(y1)))
    # 겹치거나 위아래로 붙은(표가 두 조각 난 경우) 상자는 합친다
    changed = True
    while changed:
        changed = False
        for i in range(len(figs)):
            for j in range(i + 1, len(figs)):
                a, b = figs[i], figs[j]
                xo = min(a['right'], b['right']) - max(a['left'], b['left'])
                yo = min(a['bottom'], b['bottom']) - max(a['top'], b['top'])
                narrow = min(a['right'] - a['left'], b['right'] - b['left'])
                same_col = abs(a['left'] - b['left']) <= 10 and xo > 0.8 * narrow   # 표가 행 사이에서 쪼개진 경우
                if (xo > 0 and yo > 0) or (xo > 0.6 * narrow and -14 < yo <= 0) or (same_col and -40 < yo <= 0):
                    figs[i] = dict(left=min(a['left'], b['left']), top=min(a['top'], b['top']),
                                   right=max(a['right'], b['right']), bottom=max(a['bottom'], b['bottom']))
                    del figs[j]; changed = True; break
            if changed: break
    # 그림 테두리에 걸친 본문 줄(화살표·점선이 본문 쪽으로 뻗어 상자가 커진 경우)은 그림 밖으로 밀어낸다
    # (바로 위·아래 줄이 그림 밖 본문일 때만: 문단이 그림 속으로 이어지는 경우)
    body = [r for r in runs if r['role'] == 'body']
    def inside(f, r):
        cx, cy = (r['left'] + r['right']) / 2, (r['top'] + r['bottom']) / 2
        return f['left'] - 4 <= cx <= f['right'] + 4 and f['top'] - 4 <= cy <= f['bottom'] + 4
    for f in figs:
        for r in sorted((r for r in body if inside(f, r)), key=lambda r: r['top']):
            above = any(0 < r['top'] - o['top'] < 36 and not inside(f, o) for o in body)
            below = any(0 < o['top'] - r['top'] < 36 and not inside(f, o) for o in body)
            if above and r['top'] - f['top'] < 20 and f['bottom'] - r['bottom'] > 40: f['top'] = r['bottom'] + 3
            elif below and f['bottom'] - r['bottom'] < 20 and r['top'] - f['top'] > 40: f['bottom'] = r['top'] - 3
    return sorted(figs, key=lambda f: (f['top'], f['left']))

def main(pages_range):
    for n in pages_range:
        runs = runs_of(n)
        if not any(r['role'] == 'summary_label' for r in runs):   # 손글씨 글꼴이 그림 설명으로 쓰인 쪽
            for r in runs:
                if r['role'] == 'summary': r['role'] = 'fig'
        figs = figures(n, runs)
        for r in runs:
            cx, cy = (r['left'] + r['right']) / 2, (r['top'] + r['bottom']) / 2
            r['in_fig'] = any(f['left'] - 4 <= cx <= f['right'] + 4 and f['top'] - 4 <= cy <= f['bottom'] + 4 for f in figs)
        json.dump(dict(page=n, runs=runs, figs=figs), open(f'{OUT}/p{n:03d}.json', 'w'), ensure_ascii=False)
        im = Image.open(HI.format(n)).convert('RGB'); d = ImageDraw.Draw(im)
        for f in figs: d.rectangle([f['left'] * S, f['top'] * S, f['right'] * S, f['bottom'] * S], outline=(255, 0, 0), width=6)
        col = {'body': (0, 0, 255), 'h2': (255, 0, 255), 'h3': (200, 0, 200), 'fig': (255, 140, 0), 'small': (0, 160, 160), 'box_text': (0, 140, 0), 'step': (120, 0, 0)}
        for r in runs:
            if r['in_fig']: continue
            d.rectangle([r['left'] * S, r['top'] * S, r['right'] * S, r['bottom'] * S], outline=col.get(r['role'], (120, 120, 120)), width=2)
        im.resize((im.width // 3, im.height // 3)).save(f'{DBG}/p{n:03d}.png')
        print(n, 'runs', len(runs), 'figs', len(figs), 'unplaced fig-text', sum(1 for r in runs if r['role'] == 'fig' and not r['in_fig']))

if __name__ == '__main__':
    main(range(FIRST, LAST + 1))
