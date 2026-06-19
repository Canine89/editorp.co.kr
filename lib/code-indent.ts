/**
 * 언어 무관 코드 들여쓰기 정규화 (2칸 공백 통일).
 *
 * 두 가지 전략을 상황에 따라 선택한다:
 *  - 코드에 들여쓰기가 전혀 없으면(붙여넣기로 뭉개진 경우) 괄호({} [] ()) 깊이로
 *    들여쓰기를 재구성한다.
 *  - 들여쓰기가 이미 있으면 그 구조를 신뢰하고 단위만 2칸으로 바꾼다
 *    (파이썬처럼 괄호가 구조를 나타내지 않는 언어를 망가뜨리지 않기 위함).
 *
 * AST 포매터가 아니므로 줄 안의 코드는 건드리지 않는다 (+ 줄 끝 공백 제거).
 */

const INDENT_SIZE = 2;

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** 문자열 리터럴·주석 안의 괄호는 무시하고 이 줄의 괄호 깊이 변화량을 계산 */
function bracketDelta(line: string, state: { inBlockComment: boolean }): number {
  let delta = 0;
  let quote: string | null = null;
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    const next = line[i + 1];
    if (state.inBlockComment) {
      if (ch === '*' && next === '/') {
        state.inBlockComment = false;
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }
    if (quote) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === quote) quote = null;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
    } else if (ch === '/' && next === '/') {
      break; // 줄 주석
    } else if (ch === '#') {
      break; // 파이썬/셸 주석
    } else if (ch === '/' && next === '*') {
      state.inBlockComment = true;
      i += 2;
      continue;
    } else if ('([{'.includes(ch)) {
      delta += 1;
    } else if (')]}'.includes(ch)) {
      delta -= 1;
    }
    i += 1;
  }
  return delta;
}

/** 괄호 깊이 기반 들여쓰기 재구성. 중첩이 전혀 없으면 null (재구성 의미 없음) */
function reindentByBrackets(lines: string[]): string | null {
  const state = { inBlockComment: false };
  let depth = 0;
  let sawNesting = false;
  const out: string[] = [];

  for (const raw of lines) {
    const content = raw.trim();
    if (!content) {
      out.push('');
      continue;
    }
    // `}`, `});` 처럼 닫는 괄호로 시작하는 줄은 그만큼 얕은 깊이에 둔다
    const leadingClosers = state.inBlockComment ? '' : (content.match(/^[)\]}]+/)?.[0] ?? '');
    const lineDepth = Math.max(0, depth - leadingClosers.length);
    out.push(' '.repeat(lineDepth * INDENT_SIZE) + content);

    depth = Math.max(0, depth + bracketDelta(content, state));
    if (depth > 0) sawNesting = true;
  }
  return sawNesting ? out.join('\n') : null;
}

/** 기존 들여쓰기 단위를 추정해 2칸으로 재배율 */
function rescaleIndent(lines: string[]): string {
  const parsed = lines.map((line) => {
    const leading = line.match(/^[\t ]*/)![0];
    const rest = line.slice(leading.length).replace(/[ \t]+$/, '');
    let tabs = 0;
    let spaces = 0;
    for (const ch of leading) {
      if (ch === '\t') tabs += 1;
      else spaces += 1;
    }
    return { tabs, spaces, rest };
  });

  // 내용 있는 줄들의 선행 공백 수의 최대공약수 = 들여쓰기 단위 (4칸 코드면 4)
  let unit = 0;
  for (const p of parsed) {
    if (p.rest && p.spaces > 0) unit = gcd(p.spaces, unit);
  }
  if (unit === 0) unit = INDENT_SIZE;

  return parsed
    .map(({ tabs, spaces, rest }) => {
      if (!rest) return ''; // 공백뿐인 줄은 빈 줄로
      const level = tabs + Math.round(spaces / unit);
      return ' '.repeat(level * INDENT_SIZE) + rest;
    })
    .join('\n');
}

export function normalizeCodeIndent(code: string): string {
  const lines = code.split('\n');

  const hasIndent = lines.some((line) => /^[\t ]/.test(line) && line.trim().length > 0);
  if (!hasIndent) {
    const rebuilt = reindentByBrackets(lines);
    if (rebuilt !== null) return rebuilt;
  }
  return rescaleIndent(lines);
}
