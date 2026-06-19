'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { Placeholder } from '@tiptap/extensions';
import { ResizableImage } from './ResizableImage';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link2,
  Link2Off,
  Image as ImageIcon,
  Table as TableIcon,
  Undo2,
  Redo2,
  Wand2,
} from 'lucide-react';
import { normalizeCodeIndent } from '@/lib/code-indent';

/**
 * 도서 절 본문 전용 리치 텍스트 에디터.
 * 게시판용 RichTextEditor와 달리 h4·이미지·표까지 지원한다
 * (지원하지 않는 노드는 Tiptap이 로드 시 버리기 때문에 본문 보존을 위해 필수).
 */

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`rte-btn${active ? ' active' : ''}`}
    >
      {children}
    </button>
  );
}

function TextButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="rte-btn"
      style={{ width: 'auto', padding: '0 7px', fontSize: '11.5px', fontWeight: 600 }}
    >
      {label}
    </button>
  );
}

type PopoverKind = 'link' | 'image';

/** 툴바 아래에 붙는 인라인 입력 폼 — Enter로 적용, Esc로 닫기 */
function InputPopover({
  fields,
  submitLabel,
  onSubmit,
  onClose,
}: {
  fields: { id: string; label: string; placeholder: string; initial?: string }[];
  submitLabel: string;
  onSubmit: (values: Record<string, string>) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.id, f.initial ?? '']))
  );
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
    firstInputRef.current?.select();
  }, []);

  const submit = () => onSubmit(values);

  return (
    <div className="rte-popover">
      {fields.map((field, i) => (
        <label key={field.id}>
          <span>{field.label}</span>
          <input
            ref={i === 0 ? firstInputRef : undefined}
            type="text"
            value={values[field.id]}
            placeholder={field.placeholder}
            onChange={(e) => setValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
          />
        </label>
      ))}
      <button type="button" className="btn btn-primary" onClick={submit}>
        {submitLabel}
      </button>
      <button type="button" className="btn btn-secondary" onClick={onClose}>
        취소
      </button>
    </div>
  );
}

function Toolbar({ editor, actions }: { editor: Editor; actions?: React.ReactNode }) {
  const [popover, setPopover] = useState<PopoverKind | null>(null);

  const closePopover = () => {
    setPopover(null);
    editor.chain().focus().run();
  };

  const applyLink = ({ url }: Record<string, string>) => {
    const href = url.trim();
    if (!href || href === 'https://') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    setPopover(null);
  };

  const applyImage = ({ src, alt }: Record<string, string>) => {
    const url = src.trim();
    if (url) {
      editor.chain().focus().setImage({ src: url, alt: alt.trim() || undefined }).run();
    }
    setPopover(null);
  };

  /** 커서가 있는 코드 블록의 들여쓰기를 2칸 공백으로 정규화 */
  const formatCodeBlock = () => {
    const { $from } = editor.state.selection;
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name !== 'codeBlock') continue;
      const formatted = normalizeCodeIndent(node.textContent);
      if (formatted === node.textContent) return;
      const pos = $from.before(depth);
      editor
        .chain()
        .focus()
        .command(({ tr, state }) => {
          tr.replaceWith(
            pos + 1,
            pos + node.nodeSize - 1,
            formatted ? state.schema.text(formatted) : []
          );
          return true;
        })
        .run();
      return;
    }
  };

  const inTable = editor.isActive('table');
  const inCodeBlock = editor.isActive('codeBlock');

  return (
    <div className="rte-toolbar">
      <ToolbarButton label="굵게" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={15} />
      </ToolbarButton>
      <ToolbarButton label="기울임" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={15} />
      </ToolbarButton>
      <ToolbarButton label="밑줄" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline size={15} />
      </ToolbarButton>
      <ToolbarButton label="취소선" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough size={15} />
      </ToolbarButton>

      <span className="rte-divider" />

      <ToolbarButton label="제목(h2)" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 size={15} />
      </ToolbarButton>
      <ToolbarButton label="소제목(h3)" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 size={15} />
      </ToolbarButton>
      <ToolbarButton label="작은 제목(h4)" active={editor.isActive('heading', { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
        <Heading4 size={15} />
      </ToolbarButton>

      <span className="rte-divider" />

      <ToolbarButton label="글머리 목록" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={15} />
      </ToolbarButton>
      <ToolbarButton label="번호 목록" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={15} />
      </ToolbarButton>
      <ToolbarButton label="인용" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote size={15} />
      </ToolbarButton>
      <ToolbarButton label="코드 블록" active={inCodeBlock} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Code2 size={15} />
      </ToolbarButton>
      <ToolbarButton label="코드 들여쓰기 정리 (2칸)" disabled={!inCodeBlock} onClick={formatCodeBlock}>
        <Wand2 size={15} />
      </ToolbarButton>

      <span className="rte-divider" />

      <ToolbarButton
        label="링크"
        active={editor.isActive('link') || popover === 'link'}
        onClick={() => setPopover((prev) => (prev === 'link' ? null : 'link'))}
      >
        <Link2 size={15} />
      </ToolbarButton>
      <ToolbarButton label="링크 해제" disabled={!editor.isActive('link')} onClick={() => editor.chain().focus().unsetLink().run()}>
        <Link2Off size={15} />
      </ToolbarButton>
      <ToolbarButton
        label="이미지 삽입"
        active={popover === 'image'}
        onClick={() => setPopover((prev) => (prev === 'image' ? null : 'image'))}
      >
        <ImageIcon size={15} />
      </ToolbarButton>
      <ToolbarButton
        label="표 삽입 (3×3)"
        active={inTable}
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <TableIcon size={15} />
      </ToolbarButton>

      {inTable && (
        <>
          <span className="rte-divider" />
          <TextButton label="행+" onClick={() => editor.chain().focus().addRowAfter().run()} />
          <TextButton label="행−" onClick={() => editor.chain().focus().deleteRow().run()} />
          <TextButton label="열+" onClick={() => editor.chain().focus().addColumnAfter().run()} />
          <TextButton label="열−" onClick={() => editor.chain().focus().deleteColumn().run()} />
          <TextButton label="표 삭제" onClick={() => editor.chain().focus().deleteTable().run()} />
        </>
      )}

      <span className="rte-divider" />

      <ToolbarButton label="실행 취소" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 size={15} />
      </ToolbarButton>
      <ToolbarButton label="다시 실행" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 size={15} />
      </ToolbarButton>

      {actions && <div className="rte-toolbar-actions">{actions}</div>}

      {popover === 'link' && (
        <InputPopover
          fields={[
            {
              id: 'url',
              label: '링크 주소',
              placeholder: 'https://example.com',
              initial: (editor.getAttributes('link').href as string | undefined) || 'https://',
            },
          ]}
          submitLabel="적용"
          onSubmit={applyLink}
          onClose={closePopover}
        />
      )}
      {popover === 'image' && (
        <InputPopover
          fields={[
            {
              id: 'src',
              label: '이미지 경로',
              placeholder: '/books/python-intro/04.png (public/ 기준 절대 경로)',
            },
            { id: 'alt', label: '대체 텍스트', placeholder: '이미지 설명 (선택)' },
          ]}
          submitLabel="삽입"
          onSubmit={applyImage}
          onClose={closePopover}
        />
      )}
    </div>
  );
}

export function BookSectionEditor({
  initialHtml,
  onChange,
  actions,
}: {
  initialHtml: string;
  /** dirty = 사용자가 실제로 내용을 바꿨는지 (에디터 내부 정규화는 제외) */
  onChange: (html: string, dirty: boolean) => void;
  /** 스티키 툴바 오른쪽 끝에 붙는 액션 버튼 (저장/되돌리기 등) */
  actions?: React.ReactNode;
}) {
  // 에디터/플러그인이 로드 직후 스스로 문서를 정규화하는 경우(표 구조 보정 등)가 있어
  // 단순히 onUpdate 발생 여부로 "수정됨"을 판단하면 오탐이 난다.
  // 사용자가 에디터에 포커스하기 전의 변경은 기준선(baseline)으로 흡수한다.
  const baseline = useRef<string>(initialHtml);
  const userInteracted = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false },
      }),
      ResizableImage,
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder: '본문을 입력하세요' }),
    ],
    content: initialHtml,
    immediatelyRender: false,
    // Tiptap v3는 기본적으로 트랜잭션마다 리렌더하지 않아 툴바의 활성/비활성
    // 상태(isActive, can().undo 등)가 갱신되지 않는다. 이 에디터 규모에서는
    // 매 트랜잭션 리렌더 비용이 미미하므로 v2 동작으로 되돌린다.
    shouldRerenderOnTransaction: true,
    onCreate: ({ editor: e }) => {
      baseline.current = e.getHTML();
    },
    onFocus: () => {
      userInteracted.current = true;
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      if (!userInteracted.current) {
        baseline.current = html;
        onChange(html, false);
        return;
      }
      onChange(html, html !== baseline.current);
    },
    editorProps: {
      attributes: {
        // 읽기 페이지와 같은 타이포그래피로 보이도록 본문 클래스 공유
        class: 'rich-content book-content rte-area',
      },
    },
  });

  return (
    <div className="rte-wrapper">
      {editor && <Toolbar editor={editor} actions={actions} />}
      <EditorContent editor={editor} />
    </div>
  );
}
