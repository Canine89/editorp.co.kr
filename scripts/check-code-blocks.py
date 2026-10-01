"""도서 원고의 파이썬 코드 블록을 문법 검사한다. 임포트 뒤 들여쓰기가 빠지거나 코드가 둘로 갈라진 곳을 찾는다.

사용: python scripts/check-code-blocks.py [책-id ...]   (책을 주지 않으면 content/books 전체)

- 들여쓰기 오류는 거의 항상 임포트 사고다(.docx 변환에서 들여쓰기가 사라진 경우 등).
- 그 밖의 문법 오류는 의도한 예일 수 있다(>>> 대화형 셸, 오류 메시지 출력, 의사 코드, 생략 발췌).
  대화형 셸·오류 출력은 따로 세고, 나머지만 줄 번호와 함께 보여 준다.
- 원고의 <span class="mark">(코드 형광펜)는 떼고, 통째로 들여쓴 발췌("...생략..." 사이 코드)는 내어 쓴 뒤 검사한다.
"""
import ast
import textwrap
import glob
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(__file__), "..", "content", "books")
BLOCK = re.compile(r"^```python\n(.*?)^```", re.S | re.M)
# 대화형 셸, 오류 메시지(Traceback·File "…"·^ 표시 줄)
OUTPUT = re.compile(r"^(>>>|Traceback|\s*File \"|\s*\^+\s*$)", re.M)


def check(book_id: str) -> int:
    indent, other, skipped = [], [], 0
    for path in sorted(glob.glob(os.path.join(ROOT, book_id, "sections", "*.md"))):
        text = open(path, encoding="utf-8").read()
        for m in BLOCK.finditer(text):
            code = re.sub(r"</?span[^>]*>", "", m.group(1))
            line = text.count("\n", 0, m.start()) + 1
            where = f"{os.path.basename(path)}:{line}"
            if OUTPUT.search(code):
                skipped += 1
                continue
            try:
                ast.parse(textwrap.dedent(code))
            except IndentationError:
                indent.append(where)
            except SyntaxError:
                other.append(f"{where}  {code.strip().splitlines()[0][:60]}")
    if not (indent or other or skipped):
        return 0
    print(f"[{book_id}] 들여쓰기 오류 {len(indent)}곳 · 그 밖의 문법 오류 {len(other)}곳 · 대화형/오류 출력 {skipped}곳(검사 제외)")
    for w in indent:
        print(f"  들여쓰기  {w}")
    for w in other:
        print(f"  확인 필요 {w}")
    return len(indent)


books = sys.argv[1:] or sorted(d for d in os.listdir(ROOT) if os.path.isdir(os.path.join(ROOT, d)))
total = sum(check(b) for b in books)
print("들여쓰기 오류 없음" if total == 0 else f"들여쓰기 오류 합계 {total}곳 — 임포트 원고를 확인하세요")
sys.exit(1 if total else 0)
