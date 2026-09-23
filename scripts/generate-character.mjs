#!/usr/bin/env node
/**
 * 편집자P 캐릭터 일러스트 생성기 (OpenAI 이미지 편집 API)
 *
 * 사용법:
 *   npm run character:generate -- [샷 id ...] [--dry] [--quality high] [--n 1]
 *
 *   샷 id 생략 시 assets/character/shots.json 의 모든 샷을 만든다.
 *   --dry      API를 부르지 않고 보낼 프롬프트와 레퍼런스만 출력한다.
 *   --quality  low | medium | high | xhigh | max | auto (기본 high)
 *   --n        샷마다 만들 후보 수 (기본 1)
 *
 * 필요한 환경 변수(.env): OPENAI_API_KEY, OPENAI_IMAGE_MODEL(기본 gpt-image-2.5-sunburst)
 *
 * 레퍼런스: assets/character/ref-*.png (6면도에서 라벨을 잘라낸 컷)
 * 결과:     assets/character/generated/<샷id>-<시각>-<번호>.png (투명 배경 원본)
 *           assets/character/generated/log.jsonl (프롬프트·토큰 사용량 기록)
 * 사이트에 쓸 최종본은 골라서 public/character/ 로 옮긴다.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CHAR_DIR = path.join(ROOT, 'assets/character');
const OUT_DIR = path.join(CHAR_DIR, 'generated');
const API_URL = 'https://api.openai.com/v1/images/edits';

// ── CLI 인자 ────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const dry = args.includes('--dry');
const quality = flag('quality', 'high');
const n = Number(flag('n', '1'));
// 값을 받는 플래그 바로 뒤의 인자는 샷 id가 아니다
const flagValues = new Set(
  ['--quality', '--n'].flatMap((f) => (args.includes(f) ? [args[args.indexOf(f) + 1]] : [])),
);
const ids = args.filter((a) => !a.startsWith('--') && !flagValues.has(a));

const { base, shots } = JSON.parse(fs.readFileSync(path.join(CHAR_DIR, 'shots.json'), 'utf8'));
const selected = ids.length ? shots.filter((s) => ids.includes(s.id)) : shots;
const unknown = ids.filter((id) => !shots.some((s) => s.id === id));
if (unknown.length) {
  console.error(`알 수 없는 샷 id: ${unknown.join(', ')}\n가능한 id: ${shots.map((s) => s.id).join(', ')}`);
  process.exit(1);
}

const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-sunburst';
const key = process.env.OPENAI_API_KEY;
if (!dry && !key) {
  console.error('OPENAI_API_KEY가 비어 있습니다. .env 파일에 키를 입력한 뒤 다시 실행하세요.');
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

async function generate(shot) {
  const prompt = `${base}\n\n${shot.prompt}`;
  const refs = shot.refs.map((r) => path.join(CHAR_DIR, `ref-${r}.png`));
  if (dry) {
    console.log(`\n[${shot.id}] ${shot.place} · ${shot.size} · refs: ${shot.refs.join(', ')}\n${prompt}`);
    return;
  }
  const form = new FormData();
  form.append('model', model);
  form.append('prompt', prompt);
  form.append('size', shot.size);
  form.append('quality', quality);
  form.append('n', String(n));
  form.append('background', 'transparent');
  form.append('output_format', 'png');
  for (const file of refs) {
    form.append('image[]', new Blob([fs.readFileSync(file)], { type: 'image/png' }), path.basename(file));
  }

  const started = Date.now();
  const res = await fetch(API_URL, { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${shot.id}: HTTP ${res.status} ${body.error?.message ?? ''}`.trim());
  }

  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
  const files = body.data.map((item, i) => {
    const file = path.join(OUT_DIR, `${shot.id}-${stamp}-${i + 1}.png`);
    fs.writeFileSync(file, Buffer.from(item.b64_json, 'base64'));
    return path.relative(ROOT, file);
  });
  fs.appendFileSync(
    path.join(OUT_DIR, 'log.jsonl'),
    JSON.stringify({ id: shot.id, model, quality, size: shot.size, n, files, usage: body.usage ?? null, seconds: (Date.now() - started) / 1000 }) + '\n',
  );
  console.log(`[${shot.id}] ${files.join(', ')} · ${((Date.now() - started) / 1000).toFixed(1)}초 · usage ${JSON.stringify(body.usage ?? {})}`);
}

// 요청 한도(분당 이미지 수)가 낮은 계정을 고려해 순서대로 하나씩 보낸다.
let failed = 0;
for (const shot of selected) {
  try {
    await generate(shot);
  } catch (error) {
    failed++;
    console.error(error.message);
  }
}
if (failed) process.exit(1);
