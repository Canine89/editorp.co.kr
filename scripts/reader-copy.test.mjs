import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

function fixture(writeText = async () => {}) {
  const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../lib/reader-copy.ts');
  const moduleFixture = { exports: {} };
  const timers = [];
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(source, { module: moduleFixture, exports: moduleFixture.exports,
    navigator: { clipboard: { writeText } }, setTimeout: (fn) => { timers.push(fn); return timers.length; }, clearTimeout: () => {},
  });
  return { ...moduleFixture.exports, timers };
}

const { readerCodeForClipboard: clean } = fixture();

test('한 줄과 여러 줄의 입력 프롬프트를 제거', () => {
  assert.equal(clean('>>> print("안녕하세요")'), 'print("안녕하세요")');
  assert.equal(clean('>>>print(1)'), 'print(1)');
  assert.equal(clean('>>> name = "바로"\n>>> print(name)\n'), 'name = "바로"\nprint(name)\n');
});

test('연속 입력 프롬프트만 제거하고 함수의 들여쓰기·빈 줄은 보존', () => {
  const input = '>>> def greet():\n...     print("안녕하세요")\n...     print(">>>는 문자열")\n...\n>>> greet()';
  assert.equal(clean(input), 'def greet():\n    print("안녕하세요")\n    print(">>>는 문자열")\n\ngreet()');
});

test('일반 코드와 문자열·주석 속 기호 및 생략 표기는 유지', () => {
  for (const input of ['value = 8 >> 1\nprint(">>>")', 'text = """\n>>> 문자열 데이터\n... 끝\n"""', '...생략...', 'print("...")', '# >>> 주석']) {
    assert.equal(clean(input), input);
  }
  assert.equal(clean('>>> print("...")\n...생략...'), 'print("...")\n...생략...');
});

test('앞쪽 빈 줄과 CRLF 개행, 구분 공백만 처리', () => {
  assert.equal(clean('\r\n  >>> def greet():\r\n  ...     pass\r\n'), '\r\ndef greet():\r\n    pass\r\n');
  assert.equal(clean('>>>\u00a0print(1)'), 'print(1)');
});

test('터미널에서 파이썬을 시작한 예제의 셸 대기 프롬프트도 제거', () => {
  assert.equal(clean('> python\nPython 3.13.5\n>>>'), '> python\nPython 3.13.5\n');
});

function buttonFor(text, output = false) {
  const attributes = {}; const status = { textContent: '' };
  const block = { querySelector: () => ({ innerText: text }), classList: { contains: (name) => output && name === 'code-output' } };
  const button = { dataset: {}, closest: () => block, setAttribute: (key, value) => { attributes[key] = value; }, querySelector: () => status };
  return { button, attributes, status };
}

test('복사 버튼은 정리한 코드로 클립보드를 채우고 완료 피드백을 복원', async () => {
  let copied;
  const { copyReaderCode, timers } = fixture(async (text) => { copied = text; });
  const { button, attributes, status } = buttonFor('>>> print(1)');
  await copyReaderCode(button);
  assert.equal(copied, 'print(1)');
  assert.equal(button.dataset.copyState, 'done');
  assert.equal(status.textContent, '복사되었습니다');
  timers[0]();
  assert.equal(attributes['aria-label'], '코드 복사');
  assert.equal(status.textContent, '');
});

test('실행 결과의 >>>는 실제 출력 내용이므로 유지', async () => {
  let copied;
  const { copyReaderCode } = fixture(async (text) => { copied = text; });
  await copyReaderCode(buttonFor('>>> 출력 문자열', true).button);
  assert.equal(copied, '>>> 출력 문자열');
});

test('클립보드 실패 시 오류 피드백 유지', async () => {
  const { copyReaderCode } = fixture(async () => { throw new Error('복사 권한 없음'); });
  const { button, attributes } = buttonFor('>>> print(1)');
  await copyReaderCode(button);
  assert.equal(button.dataset.copyState, 'error');
  assert.equal(attributes['aria-label'], '복사하지 못했습니다. 다시 시도해 주세요');
});
