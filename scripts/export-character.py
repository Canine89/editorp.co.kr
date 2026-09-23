"""캐릭터 생성 원본(투명 PNG) → 사이트용 WebP 내보내기

설치: pip install pillow
사용: python scripts/export-character.py [샷 id ...]

- assets/character/generated/ 에서 샷마다 가장 최근 원본을 고른다.
  특정 후보를 쓰려면 assets/character/picks.json 에 {"샷id": "파일명.png"} 로 지정한다.
- 투명 여백을 잘라 캐릭터의 아랫면이 이미지 아래 끝에 닿게 한다(구분선 위에 올리기 위함).
  위·좌·우에는 약간의 여백을 남긴다.
- 긴 변을 480px로 줄여 public/character/<샷id>.webp 로 저장한다(표시 크기 160px의 3배).
- public/character/manifest.json 에 크기를 기록해 width/height 지정에 쓴다.
"""
import json
import sys
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
src = root / 'assets/character/generated'
out = root / 'public/character'
out.mkdir(parents=True, exist_ok=True)

shots = [s['id'] for s in json.loads((root / 'assets/character/shots.json').read_text())['shots']]
picks_file = root / 'assets/character/picks.json'
picks = json.loads(picks_file.read_text()) if picks_file.exists() else {}
wanted = sys.argv[1:] or shots
manifest_file = out / 'manifest.json'
manifest = json.loads(manifest_file.read_text()) if manifest_file.exists() else {}

LONG_EDGE = 480
PAD = 0.03  # 위·좌·우 여백(긴 변 대비)

for shot in wanted:
    if shot not in shots:
        sys.exit(f'알 수 없는 샷 id: {shot}')
    candidates = sorted(src.glob(f'{shot}-*.png'))
    file = src / picks[shot] if shot in picks else (candidates[-1] if candidates else None)
    if not file or not file.exists():
        print(f'[{shot}] 원본 없음, 건너뜀')
        continue
    im = Image.open(file).convert('RGBA')
    # 거의 투명한 가장자리 잡티는 무시하고 경계를 잡는다
    alpha = im.getchannel('A').point(lambda v: 255 if v > 12 else 0)
    left, top, right, bottom = alpha.getbbox()
    pad = round(max(right - left, bottom - top) * PAD)
    box = (max(0, left - pad), max(0, top - pad), min(im.width, right + pad), bottom)
    im = im.crop(box)
    scale = LONG_EDGE / max(im.size)
    if scale < 1:
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    target = out / f'{shot}.webp'
    im.save(target, 'WEBP', quality=86, method=6)
    manifest[shot] = {'width': im.width, 'height': im.height, 'source': file.name}
    print(f'[{shot}] {file.name} → {target.relative_to(root)} {im.size} {target.stat().st_size // 1024}KB')

manifest_file.write_text(json.dumps(dict(sorted(manifest.items())), ensure_ascii=False, indent=2) + '\n')
