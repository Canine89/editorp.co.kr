'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, CheckCircle2, ArrowLeft, ExternalLink, SkipForward, SkipBack } from 'lucide-react';
import Link from 'next/link';

interface TimelineItem {
  time: string;
  title: string;
}

interface Node {
  id: string;
  title: string;
  description?: string;
  youtubeUrl: string;
  youtubeId: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  x: number;
  y: number;
  parentId: string | null;
  timeline?: TimelineItem[];
}

interface Roadmap {
  id: string;
  title: string;
  description: string;
  category: string;
  nodes: Node[];
}

const difficultyConfig = {
  BEGINNER: { label: '초급', color: '#5db8a6', bg: 'rgba(93, 184, 166, 0.12)' },
  INTERMEDIATE: { label: '중급', color: '#e8a55a', bg: 'rgba(232, 165, 90, 0.12)' },
  ADVANCED: { label: '고급', color: '#c64545', bg: 'rgba(198, 69, 69, 0.12)' },
};

// "1:23" → 83, "1:02:03" → 3723
function parseTimeToSeconds(time: string): number {
  const parts = time.split(':').map((p) => parseInt(p.trim(), 10));
  if (parts.some(isNaN)) return 0;
  return parts.reduce((acc, part) => acc * 60 + part, 0);
}

export function RoadmapCanvas({ roadmap }: { roadmap: Roadmap }) {
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [startSeconds, setStartSeconds] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [mounted, setMounted] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(`completed-nodes-${roadmap.id}`);
    if (stored) {
      try {
        setCompletedNodes(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
    if (roadmap.nodes && roadmap.nodes.length > 0) {
      const rootNode = roadmap.nodes.find(n => !n.parentId) || roadmap.nodes[0];
      setSelectedNode(rootNode);
    }
  }, [roadmap.id, roadmap.nodes]);

  // Keep the active course visible in the sidebar list
  useEffect(() => {
    if (!selectedNode || !listRef.current) return;
    const activeBtn = listRef.current.querySelector('.course-btn.active');
    activeBtn?.scrollIntoView({ block: 'nearest' });
  }, [selectedNode]);

  if (!mounted) {
    return (
      <div className="canvas-skeleton">
        <style>{`
          .canvas-skeleton {
            display: flex;
            flex: 1;
            min-height: 480px;
            background: var(--colors-canvas);
          }
          .skeleton-block {
            background: var(--colors-surface-card);
            border-radius: var(--rounded-md);
            animation: skeleton-pulse 1.4s ease-in-out infinite;
          }
          @keyframes skeleton-pulse {
            0%, 100% { opacity: 0.55; }
            50% { opacity: 1; }
          }
          .skeleton-sidebar {
            width: 360px;
            flex-shrink: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            border-right: 1px solid var(--colors-hairline);
            background: var(--colors-surface-soft);
          }
          .skeleton-main {
            flex: 1;
            padding: 20px 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }
          .skeleton-video {
            width: min(100%, 860px);
            aspect-ratio: 16 / 9;
          }
          @media (max-width: 900px) {
            .canvas-skeleton { flex-direction: column; }
            .skeleton-sidebar { width: 100%; border-right: none; }
            .skeleton-video { width: 100%; }
          }
        `}</style>
        <div className="skeleton-sidebar">
          <div className="skeleton-block" style={{ height: '12px', width: '50%' }} />
          <div className="skeleton-block" style={{ height: '6px' }} />
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="skeleton-block" style={{ height: '40px' }} />
          ))}
        </div>
        <div className="skeleton-main">
          <div className="skeleton-block skeleton-video" />
          <div className="skeleton-block" style={{ height: '20px', width: 'min(60%, 480px)' }} />
          <div className="skeleton-block" style={{ height: '14px', width: 'min(80%, 640px)' }} />
        </div>
      </div>
    );
  }

  const totalNodes = roadmap.nodes.length;
  const progressPercent = totalNodes > 0
    ? Math.round((completedNodes.length / totalNodes) * 100)
    : 0;

  const selectNode = (node: Node, opts?: { autoplay?: boolean }) => {
    setSelectedNode(node);
    setStartSeconds(0);
    setAutoplay(opts?.autoplay ?? false);
  };

  const currentIndex = selectedNode ? roadmap.nodes.findIndex((n) => n.id === selectedNode.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < roadmap.nodes.length - 1;

  const toggleCompletion = (nodeId: string) => {
    const isCompleting = !completedNodes.includes(nodeId);
    const updated = isCompleting
      ? [...completedNodes, nodeId]
      : completedNodes.filter((id) => id !== nodeId);
    setCompletedNodes(updated);
    localStorage.setItem(`completed-nodes-${roadmap.id}`, JSON.stringify(updated));

    // Completing a course moves straight on to the next one
    if (isCompleting && hasNext) {
      selectNode(roadmap.nodes[currentIndex + 1]);
    }
  };

  const navigateNode = (direction: 'prev' | 'next') => {
    if (currentIndex === -1) return;
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < roadmap.nodes.length) {
      selectNode(roadmap.nodes[nextIndex]);
    }
  };

  const seekTo = (time: string) => {
    setStartSeconds(parseTimeToSeconds(time));
    setAutoplay(true);
  };

  const isSelectedCompleted = selectedNode ? completedNodes.includes(selectedNode.id) : false;

  const embedParams = new URLSearchParams();
  if (startSeconds > 0) embedParams.set('start', String(startSeconds));
  if (autoplay) embedParams.set('autoplay', '1');
  const embedQuery = embedParams.toString();

  return (
    <>
      <style>{`
        .roadmap-layout {
          display: flex;
          flex: 1;
          min-height: 0;
          width: 100%;
          background: var(--colors-canvas);
        }

        /* ── Left Sidebar ── */
        .roadmap-sidebar {
          width: 360px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: var(--colors-surface-soft);
          border-right: 1px solid var(--colors-hairline);
        }

        .sidebar-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--colors-hairline-soft);
        }

        .sidebar-nav-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .sidebar-back {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          color: var(--colors-muted);
          text-decoration: none;
          transition: color var(--transition-fast);
        }
        .sidebar-back:hover { color: var(--colors-ink); }

        .sidebar-progress-wrap {
          padding: 4px 0 0;
        }

        .sidebar-progress-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .sidebar-progress-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--colors-muted);
        }

        .sidebar-progress-value {
          font-size: 12px;
          font-weight: 600;
          color: var(--colors-primary);
        }

        .sidebar-progress-bar {
          height: 4px;
          background: var(--colors-hairline);
          border-radius: var(--rounded-pill);
          overflow: hidden;
        }

        .sidebar-progress-fill {
          height: 100%;
          background: var(--colors-primary);
          border-radius: var(--rounded-pill);
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-list-title {
          padding: 14px 20px 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--colors-muted);
        }

        .sidebar-list {
          flex: 1;
          overflow-y: auto;
        }

        /* ── Course Item ── */
        .course-item {
          position: relative;
        }

        .course-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 20px;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: all var(--transition-fast);
          border-bottom: 1px solid var(--colors-hairline-soft);
        }
        .course-btn:hover {
          background: var(--colors-surface-card);
        }
        .course-btn.active {
          background: var(--colors-surface-card);
          border-left: 3px solid var(--colors-primary);
          padding-left: 17px;
        }

        .course-status {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }
        .status-num {
          font-size: 13px;
          font-weight: 500;
          color: var(--colors-muted-soft);
          font-family: var(--font-mono);
        }
        .status-icon.completed {
          color: var(--colors-success);
        }

        .course-info {
          flex: 1;
          min-width: 0;
        }

        .course-title-text {
          font-size: 13.5px;
          font-weight: 400;
          color: var(--colors-body);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.4;
        }
        .course-btn.active .course-title-text {
          font-weight: 600;
          color: var(--colors-primary);
        }

        /* ── Right Panel ── */
        .video-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: var(--colors-canvas);
          overflow: hidden;
        }

        .video-wrapper {
          padding: 20px 24px;
          background: var(--colors-surface-soft);
          display: flex;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
          border-bottom: 1px solid var(--colors-hairline-soft);
          width: 100%;
        }

        .video-container {
          position: relative;
          /* Cap the player height so the title and actions stay visible below */
          width: min(100%, calc((100dvh - 430px) * 16 / 9));
          min-width: min(100%, 560px);
          aspect-ratio: 16 / 9;
          background: #0f0e0d;
          box-shadow: 0 4px 20px rgba(20, 20, 19, 0.06);
          border-radius: var(--rounded-md);
          overflow: hidden;
        }

        .video-container iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }

        .video-details {
          flex: 1;
          overflow-y: auto;
          padding: 24px 36px;
          background: var(--colors-canvas);
        }

        .video-details-inner {
          max-width: 960px;
          margin: 0 auto;
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        .video-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .video-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: var(--rounded-pill);
          letter-spacing: 0.03em;
        }

        .video-external-link {
          font-size: 12px;
          color: var(--colors-muted);
          display: flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          transition: color var(--transition-fast);
        }
        .video-external-link:hover { color: var(--colors-primary); }

        .video-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--colors-ink);
          line-height: 1.35;
          margin-bottom: 12px;
          letter-spacing: -0.01em;
        }

        .video-description {
          font-size: 14px;
          color: var(--colors-body);
          line-height: 1.75;
          white-space: pre-wrap;
          margin-bottom: 24px;
        }

        /* Timeline */
        .timeline-section {
          margin-bottom: 28px;
        }
        .timeline-heading {
          font-size: 12px;
          font-weight: 700;
          color: var(--colors-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 14px;
        }
        .timeline-list {
          border-left: 2px solid var(--colors-hairline);
          padding-left: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .timeline-item {
          position: relative;
          display: flex;
          align-items: baseline;
          background: none;
          border: none;
          padding: 0;
          font-family: inherit;
          cursor: pointer;
          text-align: left;
        }
        .timeline-item:hover .timeline-time {
          text-decoration: underline;
        }
        .timeline-item:hover .timeline-text {
          color: var(--colors-primary);
        }
        .timeline-dot {
          position: absolute;
          left: -25px;
          top: 4px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--colors-primary);
          border: 2px solid var(--colors-canvas);
        }
        .timeline-time {
          font-size: 12px;
          font-weight: 700;
          color: var(--colors-primary);
          margin-right: 8px;
          font-family: var(--font-mono);
          flex-shrink: 0;
        }
        .timeline-text {
          font-size: 13px;
          color: var(--colors-ink);
          transition: color var(--transition-fast);
        }

        /* Action area */
        .action-area {
          border-top: 1px solid var(--colors-hairline-soft);
          padding-top: 24px;
          margin-top: auto;
        }

        .btn-complete {
          width: 100%;
          padding: 14px;
          border-radius: var(--rounded-md);
          border: none;
          font-weight: 500;
          font-size: 14px;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all var(--transition-fast);
          margin-bottom: 12px;
        }
        .btn-complete.pending {
          background: var(--colors-primary);
          color: #fff;
        }
        .btn-complete.pending:hover {
          background: var(--colors-primary-active);
        }
        .btn-complete.pending:active {
          background: color-mix(in srgb, var(--colors-primary-active) 85%, var(--colors-ink));
        }
        .btn-complete.done {
          background: var(--colors-success);
          color: #fff;
        }
        .btn-complete.done:hover {
          background: color-mix(in srgb, var(--colors-success) 88%, var(--colors-ink));
        }

        .nav-row {
          display: flex;
          gap: 8px;
        }

        .btn-nav {
          flex: 1;
          padding: 10px;
          border-radius: var(--rounded-md);
          border: 1px solid var(--colors-hairline);
          background: transparent;
          font-size: 13px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          color: var(--colors-ink);
          transition: all var(--transition-fast);
        }
        .btn-nav:hover:not(:disabled) {
          background: var(--colors-surface-soft);
        }
        .btn-nav:active:not(:disabled) {
          background: var(--colors-surface-cream-strong);
        }
        .btn-nav:disabled {
          color: var(--colors-muted-soft);
          border-color: var(--colors-hairline-soft);
          cursor: not-allowed;
        }

        /* Empty state */
        .empty-panel {
          display: flex;
          flex: 1;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: var(--colors-muted);
        }

        /* ── Mobile: video on top (sticky), course list below ── */
        @media (max-width: 900px) {
          .roadmap-layout {
            flex-direction: column;
            height: auto;
            min-height: 0;
          }
          .video-panel {
            order: 1;
            overflow: visible;
          }
          .video-wrapper {
            position: sticky;
            top: 64px; /* keep the player below the sticky site header */
            z-index: 20;
            padding: 0;
            border-bottom: 1px solid var(--colors-hairline);
          }
          .video-container {
            width: 100%;
            min-width: 0;
            border-radius: 0;
            box-shadow: none;
          }
          .video-details {
            overflow-y: visible;
            padding: 20px;
          }
          .roadmap-sidebar {
            order: 2;
            width: 100%;
            border-right: none;
            border-top: 1px solid var(--colors-hairline);
          }
          .sidebar-list {
            overflow-y: visible;
          }
        }
      `}</style>

      <div className="roadmap-layout">

        {/* ─── Left Sidebar ─── */}
        <div className="roadmap-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-nav-row">
              <Link href="/" className="sidebar-back">
                <ArrowLeft size={14} /> 목록으로
              </Link>
              <span style={{ color: 'var(--colors-hairline)' }}>·</span>
              <span className="badge badge-cream" style={{ padding: '2px 10px', fontSize: '11px' }}>
                {roadmap.category}
              </span>
            </div>

            <div className="sidebar-progress-wrap">
              <div className="sidebar-progress-top">
                <span className="sidebar-progress-label">학습 진행률</span>
                <span className="sidebar-progress-value">{progressPercent}%</span>
              </div>
              <div className="sidebar-progress-bar">
                <div className="sidebar-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--colors-muted-soft)' }}>
                  {completedNodes.length} / {totalNodes} 완료
                </span>
                <span style={{ fontSize: '11px', color: 'var(--colors-muted-soft)' }}>
                  진행률은 이 브라우저에 저장돼요
                </span>
              </div>
            </div>
          </div>

          <div className="sidebar-list-title">
            교육과정 목록
          </div>

          <div className="sidebar-list" ref={listRef}>
            {roadmap.nodes.map((node, idx) => {
              const isCompleted = completedNodes.includes(node.id);
              const isSelected = selectedNode?.id === node.id;

              return (
                <div key={node.id} className="course-item">
                  <button
                    className={`course-btn${isSelected ? ' active' : ''}`}
                    onClick={() => selectNode(node)}
                  >
                    <div className="course-status">
                      {isCompleted ? (
                        <CheckCircle2 size={15} className="status-icon completed" />
                      ) : (
                        <span className="status-num">{idx + 1}</span>
                      )}
                    </div>
                    <div className="course-info">
                      <div className="course-title-text">
                        {node.title}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Right Panel ─── */}
        <div className="video-panel">
          {selectedNode ? (
            <>
              <div className="video-wrapper">
                <div className="video-container">
                  <iframe
                    key={`${selectedNode.youtubeId}-${selectedNode.id}-${startSeconds}-${autoplay}`}
                    src={`https://www.youtube.com/embed/${selectedNode.youtubeId}${embedQuery ? `?${embedQuery}` : ''}`}
                    title={selectedNode.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>

              <div className="video-details">
                <div className="video-details-inner">
                  <div className="video-meta-row">
                    <span
                      className="video-badge"
                      style={{
                        backgroundColor: difficultyConfig[selectedNode.difficulty].bg,
                        color: difficultyConfig[selectedNode.difficulty].color,
                      }}
                    >
                      {difficultyConfig[selectedNode.difficulty].label} · {currentIndex + 1}/{totalNodes}강
                    </span>
                    <a
                      href={selectedNode.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="video-external-link"
                    >
                      YouTube에서 보기 <ExternalLink size={12} />
                    </a>
                  </div>

                  <h2 className="video-title">{selectedNode.title}</h2>

                  {selectedNode.description && (
                    <p className="video-description">{selectedNode.description}</p>
                  )}

                  {selectedNode.timeline && selectedNode.timeline.length > 0 && (
                    <div className="timeline-section">
                      <h3 className="timeline-heading">타임라인</h3>
                      <div className="timeline-list">
                        {selectedNode.timeline.map((item, idx) => (
                          <button key={idx} className="timeline-item" onClick={() => seekTo(item.time)}>
                            <div className="timeline-dot" />
                            <span className="timeline-time">{item.time}</span>
                            <span className="timeline-text">{item.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="action-area">
                    <button
                      className={`btn-complete ${isSelectedCompleted ? 'done' : 'pending'}`}
                      onClick={() => toggleCompletion(selectedNode.id)}
                    >
                      <CheckCircle2 size={18} />
                      {isSelectedCompleted
                        ? '학습 완료됨 (다시 누르면 취소)'
                        : hasNext
                          ? '학습 완료하고 다음 강의로'
                          : '학습 완료로 표시'}
                    </button>

                    <div className="nav-row">
                      <button className="btn-nav" onClick={() => navigateNode('prev')} disabled={!hasPrev}>
                        <SkipBack size={14} /> 이전 강의
                      </button>
                      <button className="btn-nav" onClick={() => navigateNode('next')} disabled={!hasNext}>
                        다음 강의 <SkipForward size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-panel">
              <Play size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p style={{ textAlign: 'center', fontSize: '14px' }}>강의를 선택하면 영상이 재생됩니다.</p>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
