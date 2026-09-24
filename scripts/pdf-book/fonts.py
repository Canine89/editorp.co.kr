"""인쇄용 PDF의 글꼴 조합(글꼴·크기·색) 조사표. 새 책의 역할표(roles)를 정할 때 쓴다.

사용법: python scripts/pdf-book/fonts.py scripts/pdf-book/books/<책-id>.json [--min 5]
필요: poppler(pdftohtml)

글꼴 조합마다 조각 수·나온 쪽·예시 글을 많이 쓰인 순으로 보여준다.
extract.py를 한 번 돌린 뒤라면 지금 역할표가 매긴 역할도 함께 보여준다.
역할이 이상한 조합은 설정의 roles에 규칙을 더한다 (형식은 SKILL.md 참고).
"""
import re, html, json, sys, os, glob, subprocess
from collections import defaultdict

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CFG = json.load(open(sys.argv[1]))
MIN = int(sys.argv[sys.argv.index('--min') + 1]) if '--min' in sys.argv else 5
WORK = f"/tmp/pdf-book/{CFG['id']}"
XML = f'{WORK}/all.xml'
FIRST, LAST = CFG['pages']
os.makedirs(WORK, exist_ok=True)
if not os.path.exists(XML):
    subprocess.run(['pdftohtml', '-xml', '-f', '1', '-l', str(LAST), '-i', '-nodrm', '-q', os.path.join(ROOT, CFG['pdf']), XML[:-4]], check=True)

src = open(XML, encoding='utf-8').read()
fonts = {m.group(1): f"{m.group(3).split('+')[-1]}/{m.group(2)}/{m.group(4).lower()}"
         for m in re.finditer(r'<fontspec id="(\d+)" size="(-?\d+)" family="([^"]+)" color="([^"]+)"/>', src)}
stat = defaultdict(lambda: dict(n=0, pages=set(), samples=[]))
for pm in re.finditer(r'<page number="(\d+)"[^>]*>(.*?)</page>', src, re.S):
    n = int(pm.group(1))
    if not FIRST <= n <= LAST: continue
    for t in re.finditer(r'<text [^>]*font="(\d+)">(.*?)</text>', pm.group(2)):
        txt = html.unescape(re.sub(r'<[^>]+>', '', t.group(2))).strip()
        if not txt: continue
        s = stat[fonts[t.group(1)]]
        s['n'] += 1; s['pages'].add(n)
        if len(s['samples']) < 3 and txt not in s['samples']: s['samples'].append(txt[:24])

roles = defaultdict(lambda: defaultdict(int))   # extract.py 결과가 있으면 지금 매긴 역할
for f in glob.glob(f'{WORK}/pages/p*.json'):
    for r in json.load(open(f))['runs']:
        roles[r['font']][r['role']] += 1

for key, s in sorted(stat.items(), key=lambda kv: -kv[1]['n']):
    if s['n'] < MIN: continue
    pages = sorted(s['pages'])
    role = ','.join(f'{k}' for k, _ in sorted(roles[key].items(), key=lambda kv: -kv[1])) or '-'
    print(f"{s['n']:5}  {key:45} {role:14} p{pages[0]}~{pages[-1]} ({len(pages)}쪽)  {' | '.join(s['samples'])}")
