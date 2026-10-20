// Lucide Copy·Check 아이콘. 서버 HTML과 복사 후 피드백에서 같은 버튼을 유지한다.
export const COPY_BUTTON_HTML = '<button type="button" data-copy aria-label="코드 복사" title="코드 복사"><svg class="copy-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"/></svg><svg class="copy-done" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m20 6-11 11-5-5"/></svg><span class="sr-only" data-copy-status aria-live="polite"></span></button>';

const timers = new WeakMap<HTMLButtonElement, ReturnType<typeof setTimeout>>();

/** 대화형 셸 블록만 프롬프트를 뺀다. 구분 공백 한 칸만 지워 코드의 들여쓰기는 보존한다. */
export function readerCodeForClipboard(code: string): string {
  const firstLine = code.split(/\r?\n/).find((line) => line.trim());
  if (!firstLine || (!/^[\t ]*>>>(?!>)/.test(firstLine) && !/^[\t ]*>[\t ]+python(?:3(?:\.\d+)?)?[\t ]*$/.test(firstLine))) return code;
  return code.replace(/^[\t ]*(?:>>>(?!>)|\.\.\.(?=[\t \u00a0]|\r?$))[\t \u00a0]?/gm, '');
}

export async function copyReaderCode(button: HTMLButtonElement) {
  const pending = timers.get(button);
  if (pending) clearTimeout(pending);
  const block = button.closest('.code');
  const text = block?.querySelector('pre')?.innerText ?? '';
  const code = block?.classList.contains('code-output') ? text : readerCodeForClipboard(text);
  let message: string;
  try {
    await navigator.clipboard.writeText(code);
    button.dataset.copyState = 'done';
    message = '복사되었습니다';
  } catch {
    button.dataset.copyState = 'error';
    message = '복사하지 못했습니다. 다시 시도해 주세요';
  }
  button.setAttribute('aria-label', message);
  button.title = message;
  const status = button.querySelector('[data-copy-status]');
  if (status) status.textContent = message;
  timers.set(button, setTimeout(() => {
    delete button.dataset.copyState;
    button.setAttribute('aria-label', '코드 복사');
    button.title = '코드 복사';
    if (status) status.textContent = '';
    timers.delete(button);
  }, 1600));
}
