import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const requireDependency = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));

// 실제 저장 함수를 격리된 파일·Firestore 대역에 연결한다. 운영 데이터에는 접근하지 않는다.
function load(file, mocks, processOverride = process) {
  const source = ts.transpileModule(fs.readFileSync(path.join(scriptDir, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const fixtureModule = { exports: {} };
  vm.runInNewContext(source, {
    module: fixtureModule, exports: fixtureModule.exports, console, process: processOverride,
    require: (name) => Object.hasOwn(mocks, name) ? mocks[name] : requireDependency(name),
  }, { filename: file });
  return fixtureModule.exports;
}

function fixture(t, firebase = false, environment = 'development') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'editorp-books-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const originals = [
    { id: 'new-book', publishedAt: '2026-10-01' },
    { id: 'old-book', publishedAt: '2026-09-01' },
    { id: 'hidden-book', publishedAt: '2026-08-01', isPublished: false },
  ];
  for (const book of originals) {
    fs.mkdirSync(path.join(dir, 'content/books', book.id), { recursive: true });
    fs.writeFileSync(path.join(dir, 'content/books', book.id, 'book.json'), JSON.stringify({
      title: book.id, author: '원래 저자', description: '원래 소개', contentRevision: '판-1',
      parts: [{ id: 'part', title: '', chapters: [{ id: 'chapter', title: '장', sections: [{ id: '1-1', title: '절', file: '1-1.md' }] }] }],
      ...book,
    }));
  }
  const documents = new Map();
  const db = {
    doc: (id) => ({
      get: async () => ({ exists: documents.has(id), data: () => documents.get(id) }),
      set: async (value, options) => documents.set(id, options?.merge ? { ...documents.get(id), ...value } : value),
    }),
    collection: (collection) => ({ get: async () => ({
      docs: [...documents].filter(([id]) => id.startsWith(`${collection}/`) && id.split('/').length === 2)
        .map(([id, value]) => ({ id: id.split('/')[1], data: () => value })),
    }) }),
  };
  const api = load('lib/books.ts', {
    './firebase-admin': { isFirebaseConfigured: () => firebase, getDb: () => db },
    marked: { marked: {} },
  }, { env: { NODE_ENV: environment }, cwd: () => dir });
  return { api, documents, dir };
}

test('로컬 순서 저장·재조회와 비공개 제외', async (t) => {
  const { api, dir } = fixture(t);
  assert.deepEqual(Array.from(await api.listBooks(), (b) => b.id), ['new-book', 'old-book']);
  await api.saveBookOrder(['hidden-book', 'old-book', 'new-book']);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'data/book-order.json'))), ['hidden-book', 'old-book', 'new-book']);
  assert.deepEqual(Array.from(await api.listBooks(), (b) => b.id), ['old-book', 'new-book']);
  assert.deepEqual(Array.from(await api.listBooks(true), (b) => b.id), ['hidden-book', 'old-book', 'new-book']);
});

test('순서에서 책 누락·중복·알 수 없는 ID는 저장하지 않음', async (t) => {
  const { api, documents } = fixture(t, true);
  for (const ids of [null, ['new-book'], ['new-book', 'new-book', 'old-book'], ['new-book', 'old-book', '../escape']]) {
    await assert.rejects(api.saveBookOrder(ids), (e) => e instanceof api.BookInputError);
  }
  assert.equal(documents.size, 0);
});

test('Firestore 순서와 소개 오버레이, 기존 비공개·원고 구조 유지', async (t) => {
  const { api, documents } = fixture(t, true);
  documents.set('bookOverrides/old-book', { isPublished: false });
  await api.saveBookOrder(['old-book', 'new-book', 'hidden-book']);
  await api.saveBookDetails('old-book', { title: ' 수정한 제목 ', subtitle: '', author: '저자', description: '새 소개', isPublished: true, parts: [] });
  const book = await api.getBook('old-book', true);
  assert.equal(book.title, '수정한 제목');
  assert.equal(book.subtitle, '');
  assert.equal(book.isPublished, false);
  assert.equal(book.parts[0].chapters[0].sections[0].id, '1-1');
  assert.equal(book.contentRevision, '판-1');
  assert.equal(await api.getBook('old-book'), null);
  assert.deepEqual(Array.from(await api.listBooks(true), (b) => b.id), ['old-book', 'new-book', 'hidden-book']);
  assert.equal(documents.get('bookOverrides/old-book').isPublished, false);
  assert.equal(documents.get('bookOverrides/old-book').parts, undefined);
});

test('새 도서는 저장된 순서 뒤에 출간일순으로 추가', async (t) => {
  const { api, documents } = fixture(t, true);
  documents.set('librarySettings/books', { order: ['removed-book', 'old-book'] });
  assert.deepEqual(Array.from(await api.listBooks(true), (b) => b.id), ['old-book', 'new-book', 'hidden-book']);
});

test('로컬 소개 수정은 원고 구조와 공개 상태를 보존', async (t) => {
  const { api } = fixture(t);
  await api.saveBookDetails('hidden-book', { title: '변경', subtitle: '', author: '저자', description: '소개' });
  const book = await api.getBook('hidden-book', true);
  assert.equal(book.title, '변경');
  assert.equal(book.isPublished, false);
  assert.equal(book.parts.length, 1);
  await assert.rejects(api.saveBookDetails('hidden-book', { title: ' ', subtitle: '', author: '저자', description: '소개' }), (e) => e instanceof api.BookInputError);
  await assert.rejects(api.saveBookDetails('../escape', {}), (e) => e instanceof api.BookInputError);
});

test('Firebase 없는 운영 환경은 파일에 저장하지 않음', async (t) => {
  const { api, dir } = fixture(t, false, 'production');
  await assert.rejects(api.saveBookOrder(['new-book', 'old-book', 'hidden-book']), /Firebase/);
  assert.equal(fs.existsSync(path.join(dir, 'data/book-order.json')), false);
});

test('관리자 API는 인증 전 저장하지 않고 입력 오류를 400으로 응답', async (t) => {
  const { api } = fixture(t);
  let session = null;
  const mocks = {
    'next-auth': { getServerSession: async () => session },
    '../../../auth/[...nextauth]/route': { authOptions: {} },
    '@/lib/admin': { isAdminEmail: (email) => email === 'fixture-admin' },
    '@/lib/books': api,
  };
  for (const name of ['order', 'details']) {
    const route = load(`app/api/admin/books/${name}/route.ts`, mocks);
    assert.equal((await route.PUT({ json: () => { throw new Error('권한 없는 요청 본문을 읽었습니다.'); } })).status, 401);
    session = { user: { email: 'not-admin' } };
    assert.equal((await route.PUT({ json: async () => ({}) })).status, 401);
    session = { user: { email: 'fixture-admin' } };
    assert.equal((await route.PUT({ json: async () => ({}) })).status, 400);
    const body = name === 'order' ? { bookIds: ['old-book', 'new-book', 'hidden-book'] }
      : { bookId: 'new-book', details: { title: '저장한 제목', subtitle: '', author: '저자', description: '소개' } };
    assert.equal((await route.PUT({ json: async () => body })).status, 200);
    session = null;
  }
});
