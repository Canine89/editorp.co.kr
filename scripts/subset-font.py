"""설치: pip install fonttools brotli
사용: python scripts/subset-font.py /path/to/PretendardVariable.woff2
원본: https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/variable/woff2/PretendardVariable.woff2
"""
import json
import sys
from pathlib import Path
from fontTools import subset

root = Path(__file__).resolve().parents[1]
texts = [''.join(chr(i) for i in range(32, 127))]
for folder in ['app', 'components', 'lib']:
    for source in (root / folder).rglob('*'):
        if source.suffix in ['.tsx', '.ts']:
            texts.append(source.read_text())
for source in (root / 'data').glob('*.json'):
    texts.append(json.dumps(json.loads(source.read_text()), ensure_ascii=False))
options = subset.Options()
options.flavor = 'woff2'
options.layout_features = ['*']
font = subset.load_font(sys.argv[1], options)
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=''.join(texts))
subsetter.subset(font)
# OFL의 Reserved Font Name을 존중하여 수정된 글꼴의 이름을 바꾼다.
for record in font['name'].names:
    if record.nameID in (0, 13, 14):
        continue
    name = record.toUnicode()
    if 'Pretendard' in name:
        replacement = 'EditorPSans' if record.nameID == 6 else 'EditorP Sans'
        record.string = name.replace('Pretendard', replacement).encode(record.getEncoding())
target = root / 'public/fonts/EditorPSans.woff2'
font.save(target)
print(f'생성 완료: {target.name} ({target.stat().st_size // 1024}KB)')
