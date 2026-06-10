'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import { Placeholder } from '@tiptap/extensions';
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
} from 'lucide-react';

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

function Toolbar({ editor }: { editor: Editor }) {
  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('링크 주소(URL)를 입력해 주세요', prev || 'https://');
    if (url === null) return;
    if (url === '' || url === 'https://') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt(
      '이미지 주소를 입력해 주세요.\n(public/ 폴더 기준 절대 경로 예: /books/python-intro/04.png)'
    );
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  const inTable = editor.isActive('table');

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
      <ToolbarButton label="코드 블록" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Code2 size={15} />
      </ToolbarButton>

      <span className="rte-divider" />

      <ToolbarButton label="링크" active={editor.isActive('link')} onClick={setLink}>
        <Link2 size={15} />
      </ToolbarButton>
      <ToolbarButton label="링크 해제" disabled={!editor.isActive('link')} onClick={() => editor.chain().focus().unsetLink().run()}>
        <Link2Off size={15} />
      </ToolbarButton>
      <ToolbarButton label="이미지 삽입" onClick={addImage}>
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
    </div>
  );
}

export function BookSectionEditor({
  initialHtml,
  onChange,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false },
      }),
      Image,
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder: '본문을 입력하세요' }),
    ],
    content: initialHtml,
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
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
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
