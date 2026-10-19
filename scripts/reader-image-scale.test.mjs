import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import ts from 'typescript';

const dependency = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function load(file, mocks) {
  const fixture = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, { module: fixture, exports: fixture.exports, process, console,
    require: (name) => Object.hasOwn(mocks, name) ? mocks[name] : dependency(name),
  }, { filename: file });
  return fixture.exports;
}

const scale = load('lib/reader-image-scale.ts', { marked: { marked } });
const sanitizer = load('lib/sanitize.ts', {});
const renderer = load('lib/reader-render.ts', {
  marked: { marked }, shiki: { createHighlighter: async () => ({}) },
  './books': {}, './sanitize': sanitizer, './reader-image-scale': scale,
  './reader-presentation': load('lib/reader-presentation.ts', {}),
  './reader-copy': { COPY_BUTTON_HTML: '' },
});
const raw = '![설명](/books/example/image.webp "원래 제목")\n\n';
const size = { width: 1200, height: 800, variants: [{ src: '/books/example/small.webp', width: 480, height: 320 }] };
const options = { sizes: { '/books/example/image.webp': size } };

test('배율 선택은 원본 URL·대체 텍스트·제목·블록 구조를 유지', () => {
  for (const percentage of [75, 50, 25]) {
    const result = scale.setReaderImageScale(raw, percentage);
    const image = scale.editableReaderImage(result);
    assert.equal(image.href, '/books/example/image.webp');
    assert.equal(image.text, '설명');
    assert.equal(image.title, `원래 제목 [reader-scale=${percentage}]`);
    assert.equal(scale.readerImageScale(image.title), percentage);
    assert.deepEqual(marked.lexer(result).map((token) => token.type), marked.lexer(raw).map((token) => token.type));
    assert.ok(result.endsWith('\n\n'));
  }
});

test('원본 복원은 배율 설정만 지우고 제목을 복원', () => {
  const changed = scale.setReaderImageScale(scale.setReaderImageScale(raw, 25), 75);
  const restored = scale.setReaderImageScale(changed, 100);
  assert.equal(scale.editableReaderImage(restored).title, '원래 제목');
  assert.equal(scale.readerImageScale(scale.editableReaderImage(restored).title), 100);
  assert.ok(!restored.includes('[reader-scale='));
});

test('대체 텍스트의 대괄호와 제목의 따옴표가 있는 이미지도 왕복', () => {
  const source = '![a \\] b](</a-(b).png> "제목 \\"따옴표\\"")';
  const original = scale.editableReaderImage(source);
  assert.ok(original);
  const changed = scale.editableReaderImage(scale.setReaderImageScale(source, 50));
  assert.equal(changed.text, original.text);
  assert.equal(changed.href, original.href);
  assert.equal(changed.title, `${original.title} [reader-scale=50]`);
});

test('이미지 외의 블록과 여러 이미지가 있는 문단은 수정하지 않음', () => {
  for (const source of ['문단', '```text\n![](/fake.png)\n```', '![](/a.png) ![](/b.png)']) {
    assert.equal(scale.editableReaderImage(source), null);
    assert.equal(scale.setReaderImageScale(source, 25), source);
  }
});

test('렌더링 배율·반응형 크기는 바뀌고 원본 확대 경로·댓글 키는 유지', async () => {
  const original = await renderer.renderReaderMarkdown(raw, options);
  for (const percentage of [75, 50, 25]) {
    const result = await renderer.renderReaderMarkdown(scale.setReaderImageScale(raw, percentage), options);
    assert.match(result.html, new RegExp(`data-image-scale="${percentage}"`));
    assert.ok(result.html.includes(`width:min(${percentage}%, ${640 * percentage / 100}px)`));
    assert.ok(result.html.includes('data-original-src="/books/example/image.webp"'));
    assert.ok(result.html.includes('width="1200" height="800"'));
    assert.deepEqual(Array.from(result.paragraphKeys), Array.from(original.paragraphKeys));
    assert.equal(result.html.match(/data-src="(\d+)"/)?.[1], original.html.match(/data-src="(\d+)"/)?.[1]);
  }
});

test('작은 이미지의 25%는 원본 너비의 25%, 잘못된 배율은 기본 크기', async () => {
  const small = await renderer.renderReaderMarkdown(scale.setReaderImageScale(raw, 25), { sizes: { '/books/example/image.webp': { width: 200, height: 100 } } });
  assert.ok(small.html.includes('width:min(25%, 50px)'));
  assert.equal(scale.readerImageScale('[reader-scale=999]'), 100);
  assert.equal(scale.readerImageScale('[reader-scale=25];color:red'), 100);
  const standard = await renderer.renderReaderMarkdown(raw, options);
  assert.ok(!standard.html.includes('style="width:'));
});
