"""인쇄용 PDF → 무료 도서 2단계: extract.py 결과로 content/books/<id>(book.json + sections/*.md)와
public/books/<id>/*.webp(그림), public/covers/<id>.jpg(표지)를 만든다.

사용법: python scripts/pdf-book/assemble.py scripts/pdf-book/books/<책-id>.json
        node scripts/book-image-sizes.mjs <책-id>   (그림 크기 목록 갱신)

- 설정의 chapters: 쪽 범위로 정한 절(sections) 또는 쪽 범위 + 목차 제목(headings)으로 나눌 장.
  headings는 본문 h2(또는 '바로 NN')와 순서대로 맞춰 절을 자른다. 맞추지 못하면 멈춘다.
- 코너는 인용문으로 적는다: **NOTE**, **프롬프트**, **1:1 코칭 · 제목**, **바로 핵심 요약**, **미리 알아두세요!** 등.
  리더(lib/reader-render.ts)가 첫 줄 라벨을 보고 코너 스타일을 붙인다.
- 실습 단계는 'NN 본문' 문단, 그림은 쪽 이미지에서 잘라낸 WebP.
- 책 정보(book)의 purchase·preview는 book.json에 그대로 들어가 구매 안내와 이어지는 목차에 쓰인다.
"""
import json, re, os, sys, shutil, unicodedata
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CFG = json.load(open(sys.argv[1]))
BOOK_ID = CFG['id']
WORK = f'/tmp/pdf-book/{BOOK_ID}'
PAGES = f'{WORK}/pages'; HI = WORK + '/hi/p-{:03d}.png'
OUT = f'{ROOT}/content/books/{BOOK_ID}'; IMG = f'{ROOT}/public/books/{BOOK_ID}'
S = 2

CHAPTERS = []   # (제목, 쪽 범위 절 목록) 또는 (제목, 시작 쪽, 끝 쪽, 목차 제목들)
PART_OF = []    # 장마다 속한 큰 묶음(예: '01장 바이브 코딩 시작하기'), 없으면 ''
for ch in CFG['chapters']:
    if 'sections' in ch:
        CHAPTERS.append((ch['title'], [(sec['pages'][0], sec['pages'][1], sec['title']) for sec in ch['sections']]))
    else:
        CHAPTERS.append((ch['title'], ch['pages'][0], ch['pages'][1], ch['headings']))
    PART_OF.append(ch.get('part', ''))

FAM = {'body': 'body', 'annot': 'body', 'step': 'body', 'label': 'body', 'kbd': 'body', 'code': 'code',
       'quiz_label': 'box', 'quiz_answer': 'box',
       'h2': 'h2', 'ex_label': 'h2', 'tag': 'h2', 'qnum': 'h2', 'h3': 'h3', 'h4': 'h4',
       'note_label': 'note', 'small': 'note', 'box_label': 'box', 'box_text': 'box', 'coach_tag': 'box', 'coach_title': 'box',
       'side_title': 'side', 'side_text': 'side', 'summary_label': 'summary', 'summary': 'summary'}
PRIO = ['h2', 'h3', 'h4', 'note', 'box', 'side', 'summary', 'code', 'body']
GAP = {'body': 12, 'note': 14, 'box': 22, 'side': 22, 'summary': 12, 'h2': 8, 'h3': 8, 'h4': 8, 'code': 12}

# 원문자 글리프가 ➊·❷처럼 섞여 들어오므로 ❶ 계열로 맞춘다
CIRCLED = {0x278A + i: 0x2776 + i for i in range(10)}

def norm(t):
    return re.sub(r'[\s\W_]+', '', unicodedata.normalize('NFC', t))

def lines_of(runs):
    """같은 높이(±5)의 조각을 한 행으로 모은 뒤, 가로로 40 넘게 떨어지면 다른 줄(나란한 박스)로 나눈다"""
    runs = sorted(runs, key=lambda r: r['top'])
    rows = []
    for r in runs:
        # 바로 앞 조각과 5 이내, 행 전체 높이 폭은 10 이내 (단계 번호·키 모양이 몇 px씩 어긋나 있다)
        if rows and r['top'] - rows[-1][-1]['top'] <= 5 and r['top'] - rows[-1][0]['top'] <= 10: rows[-1].append(r)
        else: rows.append([r])
    lines = []
    for row in rows:
        row.sort(key=lambda r: r['left'])
        cur = None
        for r in row:
            side = FAM.get(r['role']) == 'side'
            if cur and r['left'] - cur['right'] <= 40 and side == cur['side']:
                cur['runs'].append(r); cur['right'] = max(cur['right'], r['right']); cur['bottom'] = max(cur['bottom'], r['bottom'])
                cur['top'] = min(cur['top'], r['top'])
            else:
                cur = dict(top=r['top'], left=r['left'], right=r['right'], bottom=r['bottom'], runs=[r], side=side); lines.append(cur)
    # 실습 단계 번호만 있는 줄은 세로로 가장 가까운 본문 줄 앞에 붙인다
    steps = [l for l in lines if all(r['role'] == 'step' for r in l['runs'])]
    for st in steps:
        cy = (st['top'] + st['bottom']) / 2
        cands = [l for l in lines if l is not st and l not in steps and l['left'] >= st['left'] - 4
                 and abs((l['top'] + l['bottom']) / 2 - cy) <= 16]
        if cands:
            tgt = min(cands, key=lambda l: (abs((l['top'] + l['bottom']) / 2 - cy), l['top']))
            tgt['runs'] = st['runs'] + tgt['runs']; tgt['left'] = min(tgt['left'], st['left'])
            lines.remove(st)
    for ln in lines:
        roles = {FAM[r['role']] for r in ln['runs'] if r['role'] in FAM}
        if 'code' in roles and len(roles) > 1: roles.discard('code')      # 문장 속 코드는 본문
        ln['fam'] = next((f for f in PRIO if f in roles), 'body')
    return sorted(lines, key=lambda l: (l['top'], l['left']))

def blocks_of(lines):
    blocks = []
    for ln in lines:
        for b in reversed(blocks[-6:]):
            if b['fam'] != ln['fam']: continue
            # 제목 줄: '바로 01' 알약·PC/모바일 태그·Q번호가 제목과 떨어져 있어도 같은 높이면 한 제목
            if ln['fam'] == 'h2' and abs(ln['top'] - b['top']) <= 12:
                b['lines'][0]['runs'] += ln['runs']; b['right'] = max(b['right'], ln['right']); b['left'] = min(b['left'], ln['left']); break
            xo = min(b['right'], ln['right']) - max(b['left'], ln['left'])
            # 박스 안에서는 라벨('잠깐 퀴즈' 등)과 글이 가로로 조금 떨어져 있어도 한 박스
            near = xo > 0 or (ln['fam'] == 'box' and xo > -40)
            # 박스 안의 라벨은 글 줄과 세로로 겹쳐 놓이기도 한다
            low = -24 if ln['fam'] == 'box' else -4
            if near and low <= ln['top'] - b['bottom'] <= GAP[ln['fam']]:
                b['lines'].append(ln); b['bottom'] = max(b['bottom'], ln['bottom'])
                b['left'] = min(b['left'], ln['left']); b['right'] = max(b['right'], ln['right']); break
        else:
            blocks.append(dict(fam=ln['fam'], top=ln['top'], left=ln['left'], right=ln['right'], bottom=ln['bottom'], lines=[ln]))
    return blocks

LINK = re.compile(r'(?<![\w/.@])((?:bit\.ly|youtu\.be|open\.kakao\.com|youtube\.com|chatgpt\.com|www\.[\w-]+\.[\w.]+|[\w-]+(?:\.[\w-]+)*\.(?:com|co\.kr|or\.kr|kr|io|ai|org|net|dev|app|so|me))(?:/[\w\-./@?=&%#]*)?)')

def text_of(lines, skip=('step', 'note_label', 'box_label', 'coach_tag', 'coach_title', 'ex_label', 'tag', 'qnum', 'side_title', 'summary_label', 'quiz_label', 'quiz_answer'), wrap_right=None):
    """줄들을 한 문단 글로. 굵은 말은 **, 영문 병기는 (Agent)
    wrap_right: 상자 오른쪽 끝. 그보다 한참 앞에서 끝난 줄은 원래 줄바꿈(AI 답변의 항목 등)이라 줄을 나눈다"""
    segs = []  # (text, bold)
    prev_end = ''
    for i, ln in enumerate(lines):
        parts = []
        for r in sorted(ln['runs'], key=lambda r: r['left']):
            if r['role'] in skip or r['in_fig']: continue
            t = r['text']
            if r['role'] == 'annot': t = f'({t.strip()})'
            if r['role'] in ('kbd', 'code') and t.strip(): t = f'`{t.strip()}`'
            bold = r['bold'] and r['role'] in ('body', 'label', 'box_text', 'side_text', 'small', 'summary') or r['role'] == 'label'
            parts.append((t, bold))
        if not parts: continue
        first = parts[0][0]
        if segs and wrap_right and lines[i - 1]['right'] < wrap_right - 60:
            segs.append(('\n', False))
        elif segs and prev_end and not prev_end.endswith(' ') and not first.startswith(' '):
            if re.search(r'[.!?,:)\]]$', prev_end) or (re.search(r'[A-Za-z0-9]$', prev_end) and re.match(r'[가-힣]', first) and False):
                segs.append((' ', False))
        segs.extend(parts)
        prev_end = parts[-1][0]
    # 같은 굵기끼리 합치고 마크다운으로
    merged = []
    for t, b in segs:
        if merged and merged[-1][1] == b: merged[-1] = (merged[-1][0] + t, b)
        else: merged.append((t, b))
    # 낱말 중간의 한글 한 글자 굵게(조판 흔적, 예: 디렉**터**리)는 굵게를 뺀다
    merged = [(t, b and not re.fullmatch(r'[가-힣]', t)) for t, b in merged]
    out = ''
    for t, b in merged:
        if b and t.strip():
            lead = t[: len(t) - len(t.lstrip())]; trail = t[len(t.rstrip()):]
            out += f'{lead}**{t.strip()}**{trail}'
        else:
            out += t
    out = re.sub(r'[ \t]+', ' ', out).strip()
    out = re.sub(r' *\n *', '\n', out)
    return out.translate(CIRCLED)

def linkify(t):
    return LINK.sub(lambda m: f'[{m.group(1)}](https://{m.group(1)})', t)

def body_md(b):
    """본문 블록: 글머리표 줄은 목록, 실습 단계는 'NN ' 접두"""
    out = []
    steprun = next((r for r in b['lines'][0]['runs'] if r['role'] == 'step'), None)
    # 단계 번호가 둘째 줄 이후에 붙었다면 그 줄에서 블록을 새로 시작한 것으로 본다 (앞 줄은 앞 문단)
    items = []  # 글머리표 기준으로 줄 묶기
    for ln in b['lines']:
        txt0 = ''.join(r['text'] for r in sorted(ln['runs'], key=lambda r: r['left']) if not r['in_fig']).strip()
        if txt0.startswith('•') or not items: items.append([ln])
        else: items[-1].append(ln)
    for group in items:
        t = text_of(group)
        if not t: continue
        if t.startswith('•'):
            out.append('- ' + linkify(t.lstrip('• ').strip()))
        else:
            out.append(t)
    if steprun and out:
        no = re.search(r'\d+', ''.join(r['text'] for r in b['lines'][0]['runs'] if r['role'] == 'step'))
        if no: out[0] = f'{int(no.group()):02d} ' + out[0]
    # 목록은 한 덩어리로, 문단은 빈 줄로
    md, prev_list = '', False
    for o in out:
        is_list = o.startswith('- ')
        md += ('\n' if (is_list and prev_list) else '\n\n' if md else '') + o
        prev_list = is_list
    return md

def code_md(b):
    """코드만 있는 줄 묶음 → 펜스 코드 블록. 들여쓰기는 글자 폭으로 되살린다"""
    runs = [r for ln in b['lines'] for r in ln['runs'] if r['role'] == 'code' and r['text'].strip()]
    if not runs: return ''
    cw = min(max(1.0, (r['right'] - r['left']) / max(1, len(r['text']))) for r in runs)
    out = []
    for ln in b['lines']:
        parts = sorted([r for r in ln['runs'] if r['role'] == 'code'], key=lambda r: r['left'])
        if not parts: continue
        line = ' ' * max(0, round((parts[0]['left'] - b['left']) / cw))
        for i, r in enumerate(parts):
            if i: line += ' ' if not line.endswith(' ') and not r['text'].startswith(' ') else ''
            line += r['text']
        out.append(line.rstrip())
    return '```text\n' + '\n'.join(out) + '\n```'

def heading_md(b, level):
    runs = [r for ln in b['lines'] for r in ln['runs'] if not r['in_fig']]
    ex = next((r['text'].strip() for r in runs if r['role'] == 'ex_label'), None)
    tag = next((r['text'].strip() for r in runs if r['role'] == 'tag'), None)
    q = next((r['text'].strip() for r in runs if r['role'] == 'qnum'), None)
    title = text_of(b['lines']).replace('**', '').strip()
    if ex: title = f'{ex} {title}'
    if q: title = f'{q}. {title}'
    if tag: title = f'{title} ({tag})'
    return '#' * level + ' ' + title, title

def quote(label, body):
    lines = [f'> **{label}**'] if label else []
    for para in body.split('\n\n'):
        if lines: lines.append('>')
        lines += ['> ' + l for l in para.split('\n')]
    return '\n'.join(lines)

def ends_space(ln):
    """줄 끝이 띄어쓰기로 끝났는지 (한국어 조판은 낱말 중간에서도 줄을 바꾼다)"""
    runs = sorted((r for r in (ln or {}).get('runs', []) if not r['in_fig']), key=lambda r: r['left'])
    return bool(runs) and runs[-1]['text'].endswith(' ')

def page_items(n):
    d = json.load(open(f'{PAGES}/p{n:03d}.json'))
    runs = [r for r in d['runs'] if not r['in_fig'] and r['role'] not in ('decor', 'sec_title', 'fig')]
    blocks = blocks_of(lines_of(runs))
    items = [dict(kind='block', page=n, **b) for b in blocks]
    items += [dict(kind='fig', page=n, top=f['top'], left=f['left'], bottom=f['bottom'], right=f['right'], fam='fig') for f in d['figs']]
    return sorted(items, key=lambda it: (it['top'], it['left']))

img_count = 0
def save_fig(it):
    global img_count
    im = Image.open(HI.format(it['page'])).convert('RGB')
    pad = 4
    box = [max(0, (it['left'] - pad) * S), max(0, (it['top'] - pad) * S), min(im.width, (it['right'] + pad) * S), min(im.height, (it['bottom'] + pad) * S)]
    crop = im.crop(box)
    img_count += 1
    name = f"p{it['page']:03d}-{img_count:03d}.webp"
    crop.save(f'{IMG}/{name}', 'WEBP', quality=82, method=6)
    return f'/books/{BOOK_ID}/{name}'

def render(items):
    # 이어지는 곁단 블록(질문과 회색 정답 등)은 하나로
    # 쪽 아래에 따로 놓인 회색 정답 블록은 같은 쪽의 질문 곁단으로 옮긴다
    merged = []
    grey = lambda it: all(any('#a7a5a5' in r['font'] or '#7b7879' in r['font'] for r in ln['runs']) for ln in it['lines'])
    for it in items:
        side = it['kind'] == 'block' and it['fam'] == 'side'
        prev = next((j for j in range(len(merged) - 1, -1, -1) if merged[j]['kind'] == 'block' and merged[j]['fam'] == 'side'
                     and merged[j]['page'] == it['page']), None) if side else None
        if prev is not None and (prev == len(merged) - 1 or grey(it)):
            merged[prev] = dict(merged[prev], lines=merged[prev]['lines'] + it['lines'])
        else:
            merged.append(it)
    items = merged
    md = []
    ai_next = False
    last_body = None; last_space = False
    pending_summary = []
    def flush_summary():
        if pending_summary:
            md.append(quote('바로 핵심 요약', '\n'.join('- ' + s for s in pending_summary)))
            pending_summary.clear()
    for it in items:
        if it['fam'] != 'summary': flush_summary()
        if it['kind'] == 'fig':
            src = save_fig(it)
            alt = '챗GPT 답변 화면' if ai_next else ''
            md.append(f'![{alt}]({src})'); ai_next = False
            continue
        fam = it['fam']
        runs = [r for ln in it['lines'] for r in ln['runs']]
        if fam == 'h2': md.append(heading_md(it, 2)[0])
        elif fam == 'h3': md.append(heading_md(it, 3)[0])
        elif fam == 'h4': md.append(heading_md(it, 4)[0])
        elif fam == 'body':
            t = body_md(it)
            if t and md and md[-1] is last_body and not re.search(r'[.?!:)\]”’」`*]$|[다요]$', md[-1]) \
                    and not t.startswith(('- ', '•')) and not re.match(r'\d{2}\s', t) and not md[-1].split('\n')[-1].startswith('- '):
                md[-1] = last_body = md[-1] + (' ' if last_space else '') + t
            elif t: md.append(t); last_body = t
            if t:
                tail = sorted((r for r in it['lines'][-1]['runs'] if not r['in_fig']), key=lambda r: r['left'])
                last_space = bool(tail) and tail[-1]['text'].endswith(' ')
        elif fam == 'code':
            t = code_md(it)
            if t: md.append(t)
        elif fam == 'note':
            t = text_of(it['lines'])
            if t: md.append(quote('NOTE', t))
        elif fam == 'box':
            labels = [r['text'].strip() for r in runs if r['role'] == 'box_label']
            coach = next((r['text'].strip() for r in runs if r['role'] == 'coach_title'), None)
            quiz = any(r['role'] == 'quiz_label' for r in runs)
            # 박스 안 번호 목록('1. …')은 줄마다 나눈다
            groups = []
            for ln in it['lines']:
                head = ''.join(r['text'] for r in sorted(ln['runs'], key=lambda r: r['left'])).strip()
                if re.match(r'\d+\.\s', head) or not groups: groups.append([ln])
                else: groups[-1].append(ln)
            t = '\n\n'.join(x for x in (text_of(g, wrap_right=it['right']) for g in groups) if x)
            if quiz:
                answer = ''.join(r['text'] for r in sorted([r for r in runs if r['role'] == 'quiz_answer'], key=lambda r: (r['top'], r['left'])))
                answer = re.sub(r'\s+', ' ', answer).strip()
                md.append(quote('잠깐 퀴즈', t + (f'\n\n{answer}' if answer else '')))
            elif coach: md.append(quote(f'1:1 코칭 · {coach}', t))
            elif t and 'AI' in labels and '프롬프트' not in labels: md.append(quote('AI 답변', t))
            elif t: md.append(quote('프롬프트' if '프롬프트' in labels or not labels else labels[0], t))
            if 'AI' in labels and not t: ai_next = True
            elif labels and labels[-1] == 'AI': ai_next = True
        elif fam == 'side':
            title = next((r['text'].strip() for r in runs if r['role'] == 'side_title' and not re.fullmatch(r'\d+', r['text'].strip())), '')
            items_ = []; prev_grey = False; prev_ln = None
            for ln in it['lines']:
                num = next((r for r in ln['runs'] if r['role'] == 'side_title' and re.fullmatch(r'\s*\d+\s*', r['text'])), None)
                grey = any('#a7a5a5' in r['font'] for r in ln['runs'])
                t = text_of([ln], skip=('side_title',)).replace('**', '')
                numbered = re.match(r'\d{2}\s', t)
                t = re.sub(r'^\d{2}\s*', '', t)
                if grey and t:
                    if prev_grey and not numbered: items_[-1] += (' ' if ends_space(prev_ln) else '') + t   # 번호 없는 회색 줄은 앞 정답의 이어지는 줄
                    else: items_.append('정답: ' + t)
                    prev_grey = True; prev_ln = ln; continue
                prev_grey = False
                if num or not items_: items_.append(t)
                elif t: items_[-1] += (' ' if ends_space(prev_ln) else '') + t
                prev_ln = ln
            items_ = [i for i in items_ if i]
            if title or items_: md.append(quote(title.rstrip('!?') + ('!' if title.endswith('!') else '?' if title.endswith('?') else ''), '\n'.join('- ' + i for i in items_)))
        elif fam == 'summary':
            t = text_of(it['lines'])
            if t and '요약' not in t[:8]: pending_summary.append(t)
    flush_summary()
    return '\n\n'.join(m for m in md if m.strip())

def split_sections(items, titles):
    """장 안의 흐름을 목차 제목(h2)에서 절로 나눈다. 첫 절은 제목 앞 내용(절 도입·워밍업)을 함께 가진다"""
    keys = [norm(t) for t in titles]
    bounds = []  # (item index, title index)
    ti = 0
    for i, it in enumerate(items):
        if it['kind'] != 'block' or it['fam'] != 'h2' or ti >= len(titles): continue
        h = norm(heading_md(it, 2)[1])
        k = keys[ti]
        if (k.startswith('바로') and h.startswith(k)) or (not k.startswith('바로') and k in h):
            bounds.append((i, ti)); ti += 1
    if len(bounds) != len(titles):
        raise SystemExit(f'목차 매칭 실패: {len(bounds)}/{len(titles)} {titles[len(bounds)] if len(bounds) < len(titles) else ""}')
    parts = []
    for k, (i, t) in enumerate(bounds):
        start = 0 if k == 0 else i
        end = bounds[k + 1][0] if k + 1 < len(bounds) else len(items)
        head = items[i]
        parts.append((heading_md(head, 2)[1], [x for j, x in enumerate(items[start:end], start) if j != i]))
    return parts

def main():
    shutil.rmtree(OUT, ignore_errors=True); shutil.rmtree(IMG, ignore_errors=True)
    os.makedirs(f'{OUT}/sections'); os.makedirs(IMG)
    chapters = []
    report = []
    for ci, ch in enumerate(CHAPTERS):
        title = ch[0]
        sections = []
        if isinstance(ch[1], list):   # 쪽 범위로 정한 절
            for si, (a, b, st) in enumerate(ch[1], 1):
                items = [it for n in range(a, b + 1) for it in page_items(n)]
                sections.append((st, items))
        else:
            _, a, b, titles = ch
            items = [it for n in range(a, b + 1) for it in page_items(n)]
            sections = split_sections(items, titles)
        chap = dict(id=f'c{ci}', title=title, sections=[])
        for si, (st, items) in enumerate(sections, 1):
            sid = f'{ci}-{si}'
            md = render(items)
            open(f'{OUT}/sections/{sid}.md', 'w').write(md + '\n')
            chap['sections'].append(dict(id=sid, title=st, file=f'{sid}.md'))
            report.append((sid, st, len(md), md.count('![')))
        chapters.append(chap)
    parts = []
    for chap, part in zip(chapters, PART_OF):
        if not parts or parts[-1]['title'] != part:
            parts.append(dict(id=f'p{len(parts) + 1}', title=part, chapters=[]))
        parts[-1]['chapters'].append(chap)
    book = dict(CFG['book'], parts=parts)
    if CFG.get('cover'):
        im = Image.open(os.path.join(ROOT, CFG['cover'])).convert('RGB')
        im = im.resize((800, round(im.height * 800 / im.width)), Image.LANCZOS)
        im.save(f'{ROOT}/public/covers/{BOOK_ID}.jpg', quality=86, optimize=True, progressive=True)
    json.dump(book, open(f'{OUT}/book.json', 'w'), ensure_ascii=False, indent=2)
    open(f'{OUT}/book.json', 'a').write('\n')
    for r in report: print(f'{r[0]:5} {r[3]:3}그림 {r[2]:6}자  {r[1]}')
    print('images', img_count)

if __name__ == '__main__':
    main()
