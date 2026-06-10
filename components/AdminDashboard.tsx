'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Save,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  EyeOff,
  ListVideo,
  Wand2,
  X,
} from 'lucide-react';
import { AuthButton } from './AuthButton';

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
  isActive: boolean;
  nodes: Node[];
}

interface RoadmapData {
  categories: string[];
  roadmaps: Roadmap[];
}

const difficultyConfig = {
  BEGINNER: { label: '초급', color: '#5db8a6' },
  INTERMEDIATE: { label: '중급', color: '#e8a55a' },
  ADVANCED: { label: '고급', color: '#c64545' },
} as const;

function getYouTubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : '';
}

// The public site plays lectures in array order; keep parentId/x/y consistent
// with that order so the viewer's root-node detection keeps working.
function chainNodes(nodes: Node[]): Node[] {
  return nodes.map((n, i) => ({
    ...n,
    parentId: i === 0 ? null : nodes[i - 1].id,
    x: 300,
    y: 75 + i * 150,
  }));
}

export function AdminDashboard({ initialData }: { initialData: RoadmapData }) {
  const [data, setData] = useState<RoadmapData>(initialData);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>(
    initialData.roadmaps[0]?.id || ''
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const selectedRoadmap = data.roadmaps.find((r) => r.id === selectedRoadmapId);
  const selectedNode = selectedRoadmap?.nodes.find((n) => n.id === selectedNodeId);

  const showNotification = (text: string, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 4000);
  };

  // Every data mutation goes through here so dirty tracking can't be missed
  const mutate = (updater: (prev: RoadmapData) => RoadmapData) => {
    setData(updater);
    setIsDirty(true);
  };

  // Warn before closing the tab with unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ─── Save ───
  const handleSaveData = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    setMessage(null);
    try {
      // Normalize ordering metadata across every roadmap before persisting
      const normalized: RoadmapData = {
        ...data,
        roadmaps: data.roadmaps.map((r) => ({ ...r, nodes: chainNodes(r.nodes) })),
      };
      const res = await fetch('/api/admin/save-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || '저장에 실패했습니다.');
      }
      setData(normalized);
      setIsDirty(false);
      showNotification(result.message || '변경사항이 저장되었습니다.');
    } catch (err) {
      showNotification(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.', true);
    } finally {
      setIsSaving(false);
    }
  }, [data, isSaving]);

  // Cmd/Ctrl+S saves
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveData();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSaveData]);

  // ─── Roadmap operations ───
  const handleAddRoadmap = () => {
    const newId = `roadmap-${Date.now()}`;
    const newRoadmap: Roadmap = {
      id: newId,
      title: '새로운 로드맵',
      description: '로드맵에 대한 설명을 적어주세요.',
      category: data.categories[0] || 'AI 기초',
      isActive: false,
      nodes: [],
    };
    mutate((prev) => ({ ...prev, roadmaps: [...prev.roadmaps, newRoadmap] }));
    setSelectedRoadmapId(newId);
    setSelectedNodeId(null);
  };

  const handleDeleteRoadmap = (id: string) => {
    const target = data.roadmaps.find((r) => r.id === id);
    if (!target) return;
    if (!confirm(`'${target.title}' 로드맵을 삭제할까요?\n강의 ${target.nodes.length}개가 함께 삭제됩니다.`)) return;

    const nextRoadmaps = data.roadmaps.filter((r) => r.id !== id);
    mutate((prev) => ({ ...prev, roadmaps: prev.roadmaps.filter((r) => r.id !== id) }));
    if (selectedRoadmapId === id) {
      setSelectedRoadmapId(nextRoadmaps[0]?.id || '');
      setSelectedNodeId(null);
    }
  };

  const handleUpdateRoadmapField = <K extends keyof Roadmap>(field: K, value: Roadmap[K]) => {
    if (!selectedRoadmapId) return;
    mutate((prev) => ({
      ...prev,
      roadmaps: prev.roadmaps.map((r) =>
        r.id === selectedRoadmapId ? { ...r, [field]: value } : r
      ),
    }));
  };

  // ─── Category operations ───
  const handleAddCategory = () => {
    const name = newCategory.trim();
    if (!name) return;
    if (data.categories.includes(name)) {
      showNotification('이미 있는 카테고리입니다.', true);
      return;
    }
    mutate((prev) => ({ ...prev, categories: [...prev.categories, name] }));
    setNewCategory('');
  };

  const handleDeleteCategory = (name: string) => {
    const inUse = data.roadmaps.filter((r) => r.category === name).length;
    if (inUse > 0) {
      showNotification(`'${name}' 카테고리를 쓰는 로드맵이 ${inUse}개 있어 삭제할 수 없습니다.`, true);
      return;
    }
    mutate((prev) => ({ ...prev, categories: prev.categories.filter((c) => c !== name) }));
  };

  // ─── Node operations ───
  const updateNodes = (transform: (nodes: Node[]) => Node[]) => {
    if (!selectedRoadmapId) return;
    mutate((prev) => ({
      ...prev,
      roadmaps: prev.roadmaps.map((r) =>
        r.id === selectedRoadmapId ? { ...r, nodes: chainNodes(transform(r.nodes)) } : r
      ),
    }));
  };

  const handleAddVideo = async () => {
    const url = newVideoUrl.trim();
    if (!url || !selectedRoadmapId) return;
    const videoId = getYouTubeId(url);
    if (!videoId) {
      showNotification('유효한 유튜브 링크가 아닙니다.', true);
      return;
    }
    if (selectedRoadmap?.nodes.some((n) => n.youtubeId === videoId)) {
      showNotification('이미 이 로드맵에 추가된 영상입니다.', true);
      return;
    }

    setIsAddingVideo(true);
    let title = '새 강의 (제목을 입력해주세요)';
    try {
      const res = await fetch(`/api/admin/youtube-meta?videoId=${videoId}`);
      if (res.ok) {
        const meta = await res.json();
        if (meta.title) title = meta.title;
      }
    } catch {
      // title fetch is best-effort; node is still created with a placeholder
    }

    // Deterministic id: duplicate videos within a roadmap are already rejected above
    const newNodeId = `node-${videoId}`;
    updateNodes((nodes) => [
      ...nodes,
      {
        id: newNodeId,
        title,
        description: '',
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        youtubeId: videoId,
        difficulty: 'BEGINNER',
        x: 0,
        y: 0,
        parentId: null,
      },
    ]);
    setSelectedNodeId(newNodeId);
    setNewVideoUrl('');
    setIsAddingVideo(false);
    showNotification('강의가 추가되었습니다. 제목과 난이도를 확인해주세요.');
  };

  const handleDeleteNode = (nodeId: string) => {
    const target = selectedRoadmap?.nodes.find((n) => n.id === nodeId);
    if (!target) return;
    if (!confirm(`'${target.title}' 강의를 삭제할까요?`)) return;
    updateNodes((nodes) => nodes.filter((n) => n.id !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const handleMoveNode = (nodeId: string, direction: 'up' | 'down') => {
    updateNodes((nodes) => {
      const idx = nodes.findIndex((n) => n.id === nodeId);
      const swapWith = direction === 'up' ? idx - 1 : idx + 1;
      if (idx === -1 || swapWith < 0 || swapWith >= nodes.length) return nodes;
      const next = [...nodes];
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next;
    });
  };

  const handleUpdateNodeField = <K extends keyof Node>(nodeId: string, field: K, value: Node[K]) => {
    if (!selectedRoadmapId) return;
    let extraFields: Partial<Node> = {};
    if (field === 'youtubeUrl' && typeof value === 'string') {
      extraFields = { youtubeId: getYouTubeId(value) };
    }
    mutate((prev) => ({
      ...prev,
      roadmaps: prev.roadmaps.map((r) =>
        r.id === selectedRoadmapId
          ? {
              ...r,
              nodes: r.nodes.map((n) => (n.id === nodeId ? { ...n, [field]: value, ...extraFields } : n)),
            }
          : r
      ),
    }));
  };

  const handleFetchTimeline = async () => {
    if (!selectedNode) return;
    if (!selectedNode.youtubeId) {
      showNotification('유튜브 링크를 먼저 정확하게 입력해주세요.', true);
      return;
    }
    try {
      const res = await fetch(`/api/admin/youtube-timeline?videoId=${selectedNode.youtubeId}`);
      if (!res.ok) throw new Error();
      const fetched = await res.json();
      if (fetched.error || !Array.isArray(fetched)) {
        showNotification(fetched.error || '타임라인을 가져오지 못했습니다.', true);
        return;
      }
      if (fetched.length === 0) {
        showNotification('영상 설명란에서 00:00 형식의 타임라인을 찾지 못했습니다.', true);
        return;
      }
      handleUpdateNodeField(selectedNode.id, 'timeline', fetched);
      showNotification(`타임라인 ${fetched.length}개 챕터를 불러왔습니다.`);
    } catch {
      showNotification('타임라인을 가져오는 도중 오류가 발생했습니다.', true);
    }
  };

  return (
    <div className="adm-root">
      <style>{`
        .adm-root {
          display: flex;
          flex-direction: column;
          height: calc(100dvh - 64px);
          background: var(--colors-canvas);
        }

        /* ── Top bar ── */
        .adm-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 10px 20px;
          border-bottom: 1px solid var(--colors-hairline);
          background: var(--colors-surface-soft);
          flex-shrink: 0;
        }
        .adm-topbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .adm-title {
          font-size: 17px;
          font-weight: 700;
          color: var(--colors-ink);
          margin: 0;
          white-space: nowrap;
        }
        .adm-dirty-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: var(--rounded-pill);
          white-space: nowrap;
        }
        .adm-dirty-badge.dirty {
          color: var(--colors-warning);
          background: color-mix(in srgb, var(--colors-warning) 12%, transparent);
        }
        .adm-dirty-badge.clean {
          color: var(--colors-muted-soft);
          background: var(--colors-surface-card);
        }
        .adm-topbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        /* ── 3-pane grid ── */
        .adm-grid {
          display: grid;
          grid-template-columns: 250px minmax(380px, 1fr) 400px;
          flex: 1;
          min-height: 0;
        }
        .adm-col {
          display: flex;
          flex-direction: column;
          min-height: 0;
          border-right: 1px solid var(--colors-hairline);
        }
        .adm-col:last-child { border-right: none; }
        .adm-col-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--colors-hairline-soft);
          flex-shrink: 0;
        }
        .adm-col-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--colors-ink);
          margin: 0;
        }
        .adm-col-body {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
        }

        /* ── Roadmap list ── */
        .adm-roadmap-item {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px 16px;
          border: none;
          border-bottom: 1px solid var(--colors-hairline-soft);
          background: transparent;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: background var(--transition-fast);
        }
        .adm-roadmap-item:hover { background: var(--colors-surface-soft); }
        .adm-roadmap-item.active {
          background: var(--colors-surface-card);
          border-left: 3px solid var(--colors-primary);
          padding-left: 13px;
        }
        .adm-roadmap-item-title {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--colors-ink);
          display: flex;
          align-items: center;
          gap: 6px;
          line-height: 1.35;
        }
        .adm-roadmap-item-meta {
          font-size: 11.5px;
          color: var(--colors-muted-soft);
        }

        /* ── Lecture list ── */
        .adm-lecture-row {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 16px;
          border: none;
          border-bottom: 1px solid var(--colors-hairline-soft);
          background: transparent;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: background var(--transition-fast);
        }
        .adm-lecture-row:hover { background: var(--colors-surface-soft); }
        .adm-lecture-row.active {
          background: var(--colors-surface-card);
          border-left: 3px solid var(--colors-primary);
          padding-left: 13px;
        }
        .adm-lecture-num {
          font-size: 12px;
          font-weight: 600;
          color: var(--colors-muted-soft);
          font-family: var(--font-mono);
          width: 20px;
          text-align: right;
          flex-shrink: 0;
        }
        .adm-lecture-thumb {
          width: 80px;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          border-radius: var(--rounded-xs);
          border: 1px solid var(--colors-hairline);
          background: var(--colors-surface-card);
          flex-shrink: 0;
        }
        .adm-lecture-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .adm-lecture-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--colors-body-strong);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.35;
        }
        .adm-lecture-diff {
          font-size: 11px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .adm-row-actions {
          display: flex;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
        }
        .adm-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border: none;
          border-radius: var(--rounded-xs);
          background: transparent;
          color: var(--colors-muted-soft);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .adm-icon-btn:hover:not(:disabled) {
          background: var(--colors-surface-cream-strong);
          color: var(--colors-ink);
        }
        .adm-icon-btn:disabled { opacity: 0.25; cursor: default; }
        .adm-icon-btn.danger:hover:not(:disabled) {
          background: color-mix(in srgb, var(--colors-error) 12%, transparent);
          color: var(--colors-error);
        }

        /* ── Add-video bar ── */
        .adm-add-video {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid var(--colors-hairline);
          background: var(--colors-surface-soft);
          flex-shrink: 0;
        }

        /* ── Inspector ── */
        .adm-inspector {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .adm-section-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--colors-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .adm-node-thumb {
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          border-radius: var(--rounded-md);
          border: 1px solid var(--colors-hairline);
          background: var(--colors-surface-card);
        }
        .adm-hint { font-size: 11.5px; color: var(--colors-muted-soft); }
        .adm-hint.ok { color: var(--colors-success); }
        .adm-divider {
          border: none;
          border-top: 1px solid var(--colors-hairline-soft);
          margin: 4px 0;
        }
        .adm-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 500;
          padding: 5px 8px 5px 12px;
          border-radius: var(--rounded-pill);
          background: var(--colors-surface-card);
          border: 1px solid var(--colors-hairline);
          color: var(--colors-body-strong);
        }
        .adm-chip button {
          display: inline-flex;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--colors-muted-soft);
          padding: 0;
        }
        .adm-chip button:hover { color: var(--colors-error); }

        .adm-timeline-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .adm-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 48px 24px;
          color: var(--colors-muted);
          text-align: center;
          font-size: 13.5px;
        }

        /* ── Toast ── */
        .adm-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 100;
          padding: 12px 18px;
          border-radius: var(--rounded-md);
          font-size: 13.5px;
          font-weight: 600;
          box-shadow: 0 8px 24px rgba(20, 20, 19, 0.18);
          max-width: 380px;
        }
        .adm-toast.success {
          background: var(--colors-success);
          color: #fff;
        }
        .adm-toast.error {
          background: var(--colors-error);
          color: #fff;
        }

        @media (max-width: 1100px) {
          .adm-grid { grid-template-columns: 210px minmax(320px, 1fr) 340px; }
        }
        @media (max-width: 900px) {
          .adm-root { height: auto; }
          .adm-grid { display: flex; flex-direction: column; }
          .adm-col { border-right: none; border-bottom: 1px solid var(--colors-hairline); }
          .adm-col-body { overflow-y: visible; }
        }
      `}</style>

      {/* ─── Top bar ─── */}
      <div className="adm-topbar">
        <div className="adm-topbar-left">
          <h2 className="adm-title">관리자 대시보드</h2>
          <span className={`adm-dirty-badge ${isDirty ? 'dirty' : 'clean'}`}>
            {isDirty ? '● 저장되지 않은 변경' : '모든 변경사항 저장됨'}
          </span>
        </div>
        <div className="adm-topbar-right">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ height: '36px', gap: '6px' }}
          >
            <ExternalLink size={15} /> 사이트 미리보기
          </a>
          <button
            onClick={handleSaveData}
            disabled={isSaving || !isDirty}
            className="btn btn-primary"
            style={{ height: '36px', gap: '8px' }}
            title="⌘S / Ctrl+S"
          >
            <Save size={16} /> {isSaving ? '저장 중...' : '저장'}
          </button>
          <AuthButton />
        </div>
      </div>

      {/* ─── 3-pane editor ─── */}
      <div className="adm-grid">

        {/* 1. Roadmap list */}
        <div className="adm-col">
          <div className="adm-col-header">
            <h3 className="adm-col-title">로드맵</h3>
            <button
              onClick={handleAddRoadmap}
              className="btn btn-secondary"
              style={{ padding: '0 10px', height: '28px', fontSize: '12px', gap: '4px' }}
            >
              <Plus size={13} /> 추가
            </button>
          </div>
          <div className="adm-col-body">
            {data.roadmaps.map((r) => (
              <button
                key={r.id}
                className={`adm-roadmap-item${r.id === selectedRoadmapId ? ' active' : ''}`}
                onClick={() => {
                  setSelectedRoadmapId(r.id);
                  setSelectedNodeId(null);
                }}
              >
                <span className="adm-roadmap-item-title">
                  {r.isActive === false && (
                    <EyeOff size={13} style={{ color: 'var(--colors-muted-soft)', flexShrink: 0 }} />
                  )}
                  {r.title}
                </span>
                <span className="adm-roadmap-item-meta">
                  {r.category} · 강의 {r.nodes.length}개{r.isActive === false ? ' · 비공개' : ''}
                </span>
              </button>
            ))}
            {data.roadmaps.length === 0 && (
              <div className="adm-empty">
                <p>아직 로드맵이 없어요.<br />위의 추가 버튼으로 시작하세요.</p>
              </div>
            )}
          </div>
        </div>

        {/* 2. Lecture list (order = learning order) */}
        <div className="adm-col">
          <div className="adm-col-header">
            <h3 className="adm-col-title">
              강의 목록 {selectedRoadmap ? `(${selectedRoadmap.nodes.length}개)` : ''}
            </h3>
            <span className="adm-hint">위에서 아래 순서가 곧 학습 순서예요</span>
          </div>
          <div className="adm-col-body">
            {selectedRoadmap ? (
              <>
                {selectedRoadmap.nodes.map((node, idx) => (
                  <div
                    key={node.id}
                    className={`adm-lecture-row${node.id === selectedNodeId ? ' active' : ''}`}
                    onClick={() => setSelectedNodeId(node.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setSelectedNodeId(node.id);
                    }}
                  >
                    <span className="adm-lecture-num">{idx + 1}</span>
                    {node.youtubeId ? (
                      <img
                        className="adm-lecture-thumb"
                        src={`https://i.ytimg.com/vi/${node.youtubeId}/mqdefault.jpg`}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <div className="adm-lecture-thumb" />
                    )}
                    <div className="adm-lecture-info">
                      <span className="adm-lecture-title">{node.title || '(제목 없음)'}</span>
                      <span
                        className="adm-lecture-diff"
                        style={{ color: difficultyConfig[node.difficulty].color }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: difficultyConfig[node.difficulty].color,
                          }}
                        />
                        {difficultyConfig[node.difficulty].label}
                      </span>
                    </div>
                    <div className="adm-row-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="adm-icon-btn"
                        disabled={idx === 0}
                        onClick={() => handleMoveNode(node.id, 'up')}
                        title="위로 이동"
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        className="adm-icon-btn"
                        disabled={idx === selectedRoadmap.nodes.length - 1}
                        onClick={() => handleMoveNode(node.id, 'down')}
                        title="아래로 이동"
                      >
                        <ChevronDown size={15} />
                      </button>
                      <button
                        className="adm-icon-btn danger"
                        onClick={() => handleDeleteNode(node.id)}
                        title="강의 삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {selectedRoadmap.nodes.length === 0 && (
                  <div className="adm-empty">
                    <ListVideo size={32} style={{ opacity: 0.35 }} />
                    <p>
                      아직 강의가 없어요.
                      <br />
                      아래에 유튜브 링크를 붙여넣으면 제목까지 자동으로 채워져요.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="adm-empty">
                <p>왼쪽에서 로드맵을 선택해주세요.</p>
              </div>
            )}
          </div>

          {selectedRoadmap && (
            <div className="adm-add-video">
              <input
                type="text"
                className="input-text"
                style={{ flex: 1, height: '38px', fontSize: '13px' }}
                placeholder="유튜브 링크를 붙여넣고 Enter — 제목 자동 입력"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddVideo();
                }}
                disabled={isAddingVideo}
              />
              <button
                onClick={handleAddVideo}
                disabled={isAddingVideo || !newVideoUrl.trim()}
                className="btn btn-primary"
                style={{ height: '38px', gap: '6px', flexShrink: 0 }}
              >
                <Plus size={15} /> {isAddingVideo ? '추가 중...' : '강의 추가'}
              </button>
            </div>
          )}
        </div>

        {/* 3. Inspector */}
        <div className="adm-col">
          <div className="adm-col-header">
            <h3 className="adm-col-title">{selectedNode ? '강의 설정' : '로드맵 설정'}</h3>
            {selectedNode && (
              <button
                className="btn-text"
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: 'var(--colors-muted)',
                }}
                onClick={() => setSelectedNodeId(null)}
              >
                로드맵 설정으로 ←
              </button>
            )}
          </div>
          <div className="adm-col-body">
            {selectedNode && selectedRoadmap ? (
              /* ── Lecture form ── */
              <div className="adm-inspector">
                {selectedNode.youtubeId && (
                  <img
                    className="adm-node-thumb"
                    src={`https://i.ytimg.com/vi/${selectedNode.youtubeId}/hqdefault.jpg`}
                    alt="영상 섬네일"
                  />
                )}

                <div className="form-group">
                  <label className="form-label">강의 제목</label>
                  <input
                    type="text"
                    className="input-text"
                    value={selectedNode.title}
                    onChange={(e) => handleUpdateNodeField(selectedNode.id, 'title', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">유튜브 링크</label>
                  <input
                    type="text"
                    className="input-text"
                    placeholder="https://www.youtube.com/..."
                    value={selectedNode.youtubeUrl}
                    onChange={(e) => handleUpdateNodeField(selectedNode.id, 'youtubeUrl', e.target.value)}
                  />
                  {selectedNode.youtubeId ? (
                    <div className="adm-hint ok" style={{ marginTop: '4px' }}>
                      영상 ID 인식됨: {selectedNode.youtubeId}
                    </div>
                  ) : (
                    <div className="adm-hint" style={{ marginTop: '4px', color: 'var(--colors-error)' }}>
                      영상 ID를 인식하지 못했습니다. 링크를 확인해주세요.
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">난이도</label>
                  <select
                    className="input-text"
                    style={{ padding: '0 8px' }}
                    value={selectedNode.difficulty}
                    onChange={(e) =>
                      handleUpdateNodeField(
                        selectedNode.id,
                        'difficulty',
                        e.target.value as Node['difficulty']
                      )
                    }
                  >
                    <option value="BEGINNER">초급</option>
                    <option value="INTERMEDIATE">중급</option>
                    <option value="ADVANCED">고급</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">강의 요약</label>
                  <textarea
                    className="input-text"
                    style={{ height: '120px', padding: '12px 14px', resize: 'vertical' }}
                    value={selectedNode.description || ''}
                    onChange={(e) => handleUpdateNodeField(selectedNode.id, 'description', e.target.value)}
                  />
                </div>

                <hr className="adm-divider" />

                {/* Timeline editor */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                    }}
                  >
                    <span className="adm-section-label">타임라인</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={handleFetchTimeline}
                        className="btn btn-secondary"
                        style={{ height: '28px', fontSize: '12px', padding: '0 10px', gap: '4px' }}
                        title="영상 설명란에서 00:00 형식 챕터를 자동으로 가져옵니다"
                      >
                        <Wand2 size={13} /> 자동 불러오기
                      </button>
                      <button
                        onClick={() => {
                          const updated = [...(selectedNode.timeline || []), { time: '00:00', title: '새 챕터' }];
                          handleUpdateNodeField(selectedNode.id, 'timeline', updated);
                        }}
                        className="btn btn-secondary"
                        style={{ height: '28px', fontSize: '12px', padding: '0 10px', gap: '4px' }}
                      >
                        <Plus size={13} /> 추가
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(selectedNode.timeline || []).map((item, idx) => (
                      <div key={idx} className="adm-timeline-row">
                        <input
                          type="text"
                          className="input-text"
                          style={{ width: '80px', padding: '8px 10px', textAlign: 'center', fontSize: '13px', height: '34px' }}
                          value={item.time}
                          placeholder="00:00"
                          onChange={(e) => {
                            const updated = (selectedNode.timeline || []).map((t, i) =>
                              i === idx ? { ...t, time: e.target.value } : t
                            );
                            handleUpdateNodeField(selectedNode.id, 'timeline', updated);
                          }}
                        />
                        <input
                          type="text"
                          className="input-text"
                          style={{ flex: 1, padding: '8px 10px', fontSize: '13px', height: '34px' }}
                          value={item.title}
                          placeholder="챕터 제목"
                          onChange={(e) => {
                            const updated = (selectedNode.timeline || []).map((t, i) =>
                              i === idx ? { ...t, title: e.target.value } : t
                            );
                            handleUpdateNodeField(selectedNode.id, 'timeline', updated);
                          }}
                        />
                        <button
                          className="adm-icon-btn danger"
                          onClick={() => {
                            const updated = (selectedNode.timeline || []).filter((_, i) => i !== idx);
                            handleUpdateNodeField(selectedNode.id, 'timeline', updated);
                          }}
                          title="챕터 삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {(selectedNode.timeline || []).length === 0 && (
                      <span className="adm-hint" style={{ textAlign: 'center', padding: '6px 0' }}>
                        타임라인이 비어 있어요. 자동 불러오기를 먼저 시도해보세요 — 사용자가 챕터를 눌러 해당 시점부터 볼 수 있게 됩니다.
                      </span>
                    )}
                  </div>
                </div>

                <hr className="adm-divider" />

                <button
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="btn"
                  style={{
                    border: '1px solid color-mix(in srgb, var(--colors-error) 40%, transparent)',
                    color: 'var(--colors-error)',
                    background: 'transparent',
                    height: '36px',
                    gap: '6px',
                  }}
                >
                  <Trash2 size={14} /> 이 강의 삭제
                </button>
              </div>
            ) : selectedRoadmap ? (
              /* ── Roadmap form ── */
              <div className="adm-inspector">
                <div className="form-group">
                  <label className="form-label">로드맵 타이틀</label>
                  <input
                    type="text"
                    className="input-text"
                    value={selectedRoadmap.title}
                    onChange={(e) => handleUpdateRoadmapField('title', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">간단 설명</label>
                  <textarea
                    className="input-text"
                    style={{ height: '140px', padding: '12px 14px', resize: 'vertical' }}
                    value={selectedRoadmap.description}
                    onChange={(e) => handleUpdateRoadmapField('description', e.target.value)}
                  />
                  <div className="adm-hint" style={{ marginTop: '4px' }}>
                    {'`도서 구매 : https://...` 나 `오픈카톡방 : https://...` 형식의 줄은 버튼으로 표시돼요.'}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">카테고리</label>
                  <select
                    className="input-text"
                    style={{ padding: '0 8px' }}
                    value={selectedRoadmap.category}
                    onChange={(e) => handleUpdateRoadmapField('category', e.target.value)}
                  >
                    {data.categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <label
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    color: 'var(--colors-body-strong)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedRoadmap.isActive !== false}
                    onChange={(e) => handleUpdateRoadmapField('isActive', e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--colors-primary)' }}
                  />
                  사이트에 공개
                </label>

                <a
                  href={`/roadmaps/${selectedRoadmap.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ height: '36px', gap: '6px', justifyContent: 'center' }}
                >
                  <ExternalLink size={14} /> 이 로드맵 미리보기
                </a>

                <hr className="adm-divider" />

                {/* Category management */}
                <div>
                  <span className="adm-section-label">카테고리 관리</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '10px 0' }}>
                    {data.categories.map((cat) => (
                      <span key={cat} className="adm-chip">
                        {cat}
                        <button onClick={() => handleDeleteCategory(cat)} title={`'${cat}' 삭제`}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="input-text"
                      style={{ flex: 1, height: '34px', fontSize: '13px' }}
                      placeholder="새 카테고리 이름"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCategory();
                      }}
                    />
                    <button
                      onClick={handleAddCategory}
                      disabled={!newCategory.trim()}
                      className="btn btn-secondary"
                      style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}
                    >
                      추가
                    </button>
                  </div>
                </div>

                <hr className="adm-divider" />

                <button
                  onClick={() => handleDeleteRoadmap(selectedRoadmap.id)}
                  className="btn"
                  style={{
                    border: '1px solid color-mix(in srgb, var(--colors-error) 40%, transparent)',
                    color: 'var(--colors-error)',
                    background: 'transparent',
                    height: '36px',
                    gap: '6px',
                  }}
                >
                  <Trash2 size={14} /> 이 로드맵 삭제
                </button>
              </div>
            ) : (
              <div className="adm-empty">
                <p>로드맵을 만들어 관리를 시작하세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Toast ─── */}
      {message && (
        <div className={`adm-toast ${message.isError ? 'error' : 'success'}`}>{message.text}</div>
      )}
    </div>
  );
}
