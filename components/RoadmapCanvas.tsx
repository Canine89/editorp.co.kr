'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, CheckCircle2, ChevronRight, ArrowLeft, ExternalLink, SkipForward, SkipBack } from 'lucide-react';
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

export function RoadmapCanvas({ roadmap }: { roadmap: Roadmap }) {
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Set node size constants for centering lines
  const NODE_WIDTH = 220;
  const NODE_HEIGHT = 70;

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
    // Select the first node by default if available
    if (roadmap.nodes && roadmap.nodes.length > 0) {
      // Find root node (parentId is null) or just the first node
      const rootNode = roadmap.nodes.find(n => !n.parentId) || roadmap.nodes[0];
      setSelectedNode(rootNode);
    }
  }, [roadmap.id, roadmap.nodes]);

  if (!mounted) {
    return (
      <div style={{ textAlign: 'center', padding: '128px 0', backgroundColor: 'var(--colors-canvas)' }}>
        <p style={{ color: 'var(--colors-muted)' }}>로드맵 불러오는 중...</p>
      </div>
    );
  }

  // Calculate canvas dimensions dynamically
  const maxX = Math.max(...roadmap.nodes.map((n) => n.x), 500);
  const maxY = Math.max(...roadmap.nodes.map((n) => n.y), 400);
  const canvasWidth = maxX + NODE_WIDTH + 80;
  const canvasHeight = maxY + NODE_HEIGHT + 120;

  // Calculate overall progress percentage
  const totalNodes = roadmap.nodes.length;
  const progressPercent = totalNodes > 0 
    ? Math.round((completedNodes.length / totalNodes) * 100)
    : 0;

  // Toggle completion status
  const toggleCompletion = (nodeId: string) => {
    const updated = completedNodes.includes(nodeId)
      ? completedNodes.filter((id) => id !== nodeId)
      : [...completedNodes, nodeId];
    
    setCompletedNodes(updated);
    localStorage.setItem(`completed-nodes-${roadmap.id}`, JSON.stringify(updated));
  };

  // Navigate to next or previous node
  const navigateNode = (direction: 'prev' | 'next') => {
    if (!selectedNode) return;
    const currentIndex = roadmap.nodes.findIndex((n) => n.id === selectedNode.id);
    if (currentIndex === -1) return;

    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < roadmap.nodes.length) {
      setSelectedNode(roadmap.nodes[nextIndex]);
    }
  };

  const hasPrev = selectedNode ? roadmap.nodes.findIndex((n) => n.id === selectedNode.id) > 0 : false;
  const hasNext = selectedNode ? roadmap.nodes.findIndex((n) => n.id === selectedNode.id) < roadmap.nodes.length - 1 : false;

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 180px)', backgroundColor: 'var(--colors-canvas)' }}>
      
      {/* Left Column: Roadmap Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--colors-hairline)', overflow: 'hidden' }}>
        
        {/* Subheader Toolbar */}
        <div
          style={{
            borderBottom: '1px solid var(--colors-hairline)',
            backgroundColor: 'var(--colors-surface-soft)',
            padding: '12px 24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  color: 'var(--colors-muted)',
                  textDecoration: 'none',
                }}
              >
                <ArrowLeft size={16} /> 목록으로
              </Link>
              <span style={{ color: 'var(--colors-hairline)' }}>|</span>
              <span className="badge badge-cream" style={{ padding: '2px 8px', fontSize: '11px' }}>
                {roadmap.category}
              </span>
            </div>

            {/* Progress Tracker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--colors-ink)' }}>
                진행도: {completedNodes.length}/{totalNodes} 강 ({progressPercent}%)
              </span>
              <div
                style={{
                  width: '120px',
                  height: '8px',
                  backgroundColor: 'var(--colors-hairline)',
                  borderRadius: 'var(--rounded-pill)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    backgroundColor: 'var(--colors-primary)',
                    transition: 'width var(--transition-normal)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Canvas Scroll Area */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: 'var(--colors-canvas)',
            padding: '40px var(--spacing-lg)',
            position: 'relative',
          }}
          ref={canvasRef}
        >
          <div
            style={{
              position: 'relative',
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              margin: '0 auto',
            }}
          >
            {/* SVG Connection Lines */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            >
              {roadmap.nodes.map((node) => {
                if (!node.parentId) return null;
                const parent = roadmap.nodes.find((n) => n.id === node.parentId);
                if (!parent) return null;

                // Calculate start coordinates (bottom-middle of parent)
                const startX = parent.x + NODE_WIDTH / 2;
                const startY = parent.y + NODE_HEIGHT;

                // Calculate end coordinates (top-middle of child)
                const endX = node.x + NODE_WIDTH / 2;
                const endY = node.y;

                // Path controls for smooth S-curves
                const controlY1 = startY + (endY - startY) / 2;
                const controlY2 = startY + (endY - startY) / 2;

                const pathData = `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`;
                
                // Color paths based on completion
                const isPathCompleted = completedNodes.includes(node.id) && completedNodes.includes(parent.id);
                const lineColor = isPathCompleted 
                  ? 'var(--colors-primary)' 
                  : 'var(--colors-hairline)';
                const strokeWidth = isPathCompleted ? 3 : 2;

                return (
                  <g key={`link-${parent.id}-${node.id}`}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke={lineColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={isPathCompleted ? 'none' : '4 4'}
                      style={{ transition: 'stroke var(--transition-normal), stroke-width var(--transition-normal)' }}
                    />
                    {/* Direction indicator dot */}
                    <circle 
                      cx={endX} 
                      cy={endY - 4} 
                      r="3" 
                      fill={lineColor}
                      style={{ transition: 'fill var(--transition-normal)' }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Roadmap Nodes */}
            {roadmap.nodes.map((node) => {
              const isCompleted = completedNodes.includes(node.id);
              const isSelected = selectedNode?.id === node.id;

              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="card-cream"
                  style={{
                    position: 'absolute',
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${NODE_WIDTH}px`,
                    height: `${NODE_HEIGHT}px`,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: 'var(--rounded-lg)',
                    border: isSelected
                      ? '2px solid var(--colors-primary)'
                      : isCompleted
                      ? '1.5px solid var(--colors-success)'
                      : '1px solid var(--colors-hairline)',
                    backgroundColor: isSelected
                      ? 'rgba(var(--colors-primary-rgb, 107, 78, 255), 0.04)'
                      : isCompleted 
                      ? 'var(--colors-surface-soft)' 
                      : 'var(--colors-surface-card)',
                    boxShadow: isSelected
                      ? '0 6px 16px rgba(107, 78, 255, 0.08)'
                      : '0 4px 10px rgba(20, 20, 19, 0.02)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    zIndex: 10,
                    fontFamily: 'inherit',
                    transition: 'all var(--transition-fast)',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                    {isCompleted ? (
                      <CheckCircle2 size={22} className="success-icon" style={{ color: 'var(--colors-success)', flexShrink: 0 }} />
                    ) : (
                      <Play size={20} style={{ color: isSelected ? 'var(--colors-primary)' : 'var(--colors-muted)', flexShrink: 0 }} />
                    )}
                    
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          fontSize: '11px', 
                          textTransform: 'uppercase', 
                          fontWeight: 600,
                          letterSpacing: '0.05em',
                          color: node.difficulty === 'ADVANCED' 
                            ? 'var(--colors-error)'
                            : node.difficulty === 'INTERMEDIATE'
                            ? 'var(--colors-accent-amber)'
                            : 'var(--colors-accent-teal)',
                          marginBottom: '2px'
                        }}
                      >
                        {node.difficulty === 'ADVANCED'
                          ? '고급'
                          : node.difficulty === 'INTERMEDIATE'
                          ? '중급'
                          : '초급'}
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? 'var(--colors-primary)' : 'var(--colors-ink)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {node.title}
                      </div>
                    </div>
                    <ChevronRight size={14} style={{ color: isSelected ? 'var(--colors-primary)' : 'var(--colors-muted-soft)', flexShrink: 0 }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Embedded YouTube & Details */}
      <div 
        style={{ 
          width: '480px', 
          backgroundColor: 'var(--colors-surface-card)', 
          borderLeft: '1px solid var(--colors-hairline)',
          display: 'flex', 
          flexDirection: 'column',
          zIndex: 20,
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.02)'
        }}
      >
        {selectedNode ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* 16:9 YouTube Video Embed Container */}
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', backgroundColor: '#000' }}>
              <iframe
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 0,
                }}
                src={`https://www.youtube.com/embed/${selectedNode.youtubeId}`}
                title={selectedNode.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Video Controls / Info */}
            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflowY: 'auto' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span 
                    style={{ 
                      fontSize: '11px', 
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: selectedNode.difficulty === 'ADVANCED' 
                        ? 'rgba(235, 87, 87, 0.1)'
                        : selectedNode.difficulty === 'INTERMEDIATE'
                        ? 'rgba(242, 201, 76, 0.1)'
                        : 'rgba(39, 174, 96, 0.1)',
                      color: selectedNode.difficulty === 'ADVANCED' 
                        ? 'var(--colors-error)'
                        : selectedNode.difficulty === 'INTERMEDIATE'
                        ? 'var(--colors-accent-amber)'
                        : 'var(--colors-accent-teal)',
                    }}
                  >
                    {selectedNode.difficulty === 'ADVANCED'
                      ? '고급 코스'
                      : selectedNode.difficulty === 'INTERMEDIATE'
                      ? '중급 코스'
                      : '초급 코스'}
                  </span>
                  
                  <a 
                    href={selectedNode.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '12px',
                      color: 'var(--colors-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'none',
                    }}
                    className="hover-underline"
                  >
                    YouTube에서 보기 <ExternalLink size={12} />
                  </a>
                </div>

                <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--colors-ink)', marginBottom: '12px', lineHeight: 1.4 }}>
                  {selectedNode.title}
                </h2>

                {selectedNode.description && (
                  <p style={{ fontSize: '14px', color: 'var(--colors-body)', lineHeight: 1.6, marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
                    {selectedNode.description}
                  </p>
                )}

                {/* Timeline display if available */}
                {selectedNode.timeline && selectedNode.timeline.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--colors-ink)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      타임라인 요약
                    </h3>
                    <div style={{ borderLeft: '2px solid var(--colors-hairline)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedNode.timeline.map((item, idx) => (
                        <div key={idx} style={{ position: 'relative' }}>
                          <div style={{ 
                            position: 'absolute', 
                            left: '-23px', 
                            top: '4px', 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            backgroundColor: 'var(--colors-primary)',
                            border: '2px solid var(--colors-surface-card)'
                          }} />
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--colors-primary)', marginRight: '8px' }}>{item.time}</span>
                          <span style={{ fontSize: '13px', color: 'var(--colors-ink)' }}>{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: '32px', borderTop: '1px solid var(--colors-hairline)', paddingTop: '24px' }}>
                <button
                  onClick={() => toggleCompletion(selectedNode.id)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--rounded-lg)',
                    border: 'none',
                    backgroundColor: completedNodes.includes(selectedNode.id)
                      ? 'var(--colors-success)'
                      : 'var(--colors-primary)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color var(--transition-fast)',
                    marginBottom: '16px',
                  }}
                >
                  <CheckCircle2 size={18} />
                  {completedNodes.includes(selectedNode.id) ? '학습 완료됨 (클릭하여 취소)' : '학습 완료로 표시'}
                </button>

                {/* Prev / Next Navigation */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => navigateNode('prev')}
                    disabled={!hasPrev}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 'var(--rounded-md)',
                      border: '1px solid var(--colors-hairline)',
                      backgroundColor: 'transparent',
                      color: hasPrev ? 'var(--colors-ink)' : 'var(--colors-muted-soft)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: hasPrev ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <SkipBack size={14} /> 이전 강의
                  </button>
                  <button
                    onClick={() => navigateNode('next')}
                    disabled={!hasNext}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 'var(--rounded-md)',
                      border: '1px solid var(--colors-hairline)',
                      backgroundColor: 'transparent',
                      color: hasNext ? 'var(--colors-ink)' : 'var(--colors-muted-soft)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: hasNext ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    다음 강의 <SkipForward size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'var(--colors-muted)' }}>
            <Play size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <p style={{ textAlign: 'center', fontSize: '14px' }}>로드맵에서 강의를 선택하시면 유튜브 영상과 상세 설명을 확인하실 수 있습니다.</p>
          </div>
        )}
      </div>

    </div>
  );
}

