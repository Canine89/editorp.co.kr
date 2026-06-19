'use client';

import { useRef, useState } from 'react';
import Image from '@tiptap/extension-image';
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type NodeViewProps,
} from '@tiptap/react';

/**
 * 크기 조정 가능한 이미지 확장.
 * 너비는 % 단위로 `style="width: NN%"`에 저장한다 — 저장 파이프라인
 * (sanitize → turndown → marked → sanitize)을 그대로 통과하는 형식.
 */

const MIN_PERCENT = 10;
const MAX_PERCENT = 100;
const PRESETS = [25, 50, 75, 100] as const;

function clampPercent(value: number): number {
  return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, Math.round(value)));
}

interface DragState {
  pointerId: number;
  startX: number;
  startPx: number;
  containerWidth: number;
  dir: 1 | -1;
  last: number;
}

function ImageView({ node, updateAttributes, selected, editor, getPos }: NodeViewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  // 드래그 중에는 로컬 상태로만 미리 보여주고, 놓을 때 한 번만 커밋한다
  // (이동마다 updateAttributes를 부르면 undo 히스토리가 픽셀 단위로 쪼개진다)
  const [liveWidth, setLiveWidth] = useState<number | null>(null);
  const dragState = useRef<DragState | null>(null);

  const widthPercent = liveWidth ?? (node.attrs.widthPercent as number | null);

  // 포인터 캡처를 사용해 창 밖에서 놓아도 반드시 up/cancel을 핸들이 받게 한다.
  // (window 리스너 방식은 pointerup을 놓치면 liveWidth가 유령으로 남아
  //  이후 모든 크기 변경이 가려지는 버그가 있었다)
  const startDrag = (event: React.PointerEvent<HTMLSpanElement>, dir: 1 | -1) => {
    event.preventDefault();
    event.stopPropagation();
    const wrapper = wrapperRef.current;
    const container = wrapper?.parentElement;
    if (!wrapper || !container) return;

    const cs = getComputedStyle(container);
    const containerWidth =
      container.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (containerWidth <= 0) return;

    const startPx = wrapper.getBoundingClientRect().width;
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startPx,
      containerWidth,
      dir,
      last: clampPercent((startPx / containerWidth) * 100),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: React.PointerEvent<HTMLSpanElement>) => {
    const s = dragState.current;
    if (!s || event.pointerId !== s.pointerId) return;
    const deltaPx = (event.clientX - s.startX) * s.dir;
    s.last = clampPercent(((s.startPx + deltaPx) / s.containerWidth) * 100);
    setLiveWidth(s.last);
  };

  /** commit=true면 드래그 결과를 노드에 반영, false면(취소) 원래 크기로 복귀 */
  const endDrag = (event: React.PointerEvent<HTMLSpanElement>, commit: boolean) => {
    const s = dragState.current;
    if (!s || event.pointerId !== s.pointerId) return;
    dragState.current = null;
    setLiveWidth(null);
    if (commit) updateAttributes({ widthPercent: s.last });
  };

  // PM 기본 클릭 처리는 에디터 포커스 상태에 따라 NodeSelection을 안 잡을 때가 있어
  // (포커스 이동으로 클릭이 소모되는 경우 등) 클릭 시 항상 명시적으로 노드를 선택한다.
  const selectNode = () => {
    const pos = getPos();
    if (typeof pos !== 'number') return;
    editor.chain().focus(undefined, { scrollIntoView: false }).setNodeSelection(pos).run();
    ensureControlsVisible();
  };

  // 스티키 툴바(z-index 위)가 핸들/프리셋을 가리면 클릭이 툴바에 먹힌다.
  // 이미지를 선택하는 순간 가려진 만큼 스크롤을 보정해 조작 가능하게 만든다.
  const ensureControlsVisible = () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const toolbar = wrapper.closest('.rte-wrapper')?.querySelector('.rte-toolbar');
    const coveredTop = (toolbar?.getBoundingClientRect().bottom ?? 0) + 12;

    // 위쪽: 프리셋 바(이미지 상단)가 툴바에 가려진 경우
    if (rect.top < coveredTop) {
      window.scrollBy({ top: rect.top - coveredTop, behavior: 'smooth' });
      return;
    }
    // 아래쪽: 핸들(이미지 세로 중앙)이 화면 밖인 경우
    const handleY = rect.top + rect.height / 2;
    if (handleY > window.innerHeight - 24) {
      window.scrollBy({ top: handleY - window.innerHeight + 80, behavior: 'smooth' });
    }
  };

  const handleProps = (dir: 1 | -1) => ({
    contentEditable: false,
    onPointerDown: (e: React.PointerEvent<HTMLSpanElement>) => startDrag(e, dir),
    onPointerMove: moveDrag,
    onPointerUp: (e: React.PointerEvent<HTMLSpanElement>) => endDrag(e, true),
    onPointerCancel: (e: React.PointerEvent<HTMLSpanElement>) => endDrag(e, false),
    // 캡처가 강제로 풀린 경우의 마지막 안전망 — 유령 liveWidth를 남기지 않는다
    onLostPointerCapture: (e: React.PointerEvent<HTMLSpanElement>) => endDrag(e, true),
  });

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className={`rte-img${selected ? ' selected' : ''}`}
      style={{ width: widthPercent ? `${widthPercent}%` : undefined }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={node.attrs.src as string}
        alt={(node.attrs.alt as string) ?? ''}
        title={(node.attrs.title as string) ?? undefined}
        onClick={selectNode}
        data-drag-handle
        draggable
      />
      {selected && (
        <div className="rte-img-presets" contentEditable={false}>
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => updateAttributes({ widthPercent: preset })}
              className={widthPercent === preset ? 'active' : ''}
            >
              {preset}%
            </button>
          ))}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => updateAttributes({ widthPercent: null })}
            className={widthPercent == null ? 'active' : ''}
          >
            원본
          </button>
        </div>
      )}
      {selected && (
        <>
          <span className="rte-img-handle left" {...handleProps(-1)} />
          <span className="rte-img-handle right" {...handleProps(1)} />
        </>
      )}
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      widthPercent: {
        default: null,
        parseHTML: (element) => {
          const match = (element.getAttribute('style') ?? '').match(/width:\s*([\d.]+)%/);
          return match ? clampPercent(parseFloat(match[1])) : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.widthPercent) return {};
          return { style: `width: ${attributes.widthPercent}%` };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
});
