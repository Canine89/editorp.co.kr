'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
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
  }, [roadmap.id]);

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

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Subheader Toolbar */}
      <div
        style={{
          borderBottom: '1px solid var(--colors-hairline)',
          backgroundColor: 'var(--colors-surface-soft)',
          padding: '16px 0',
        }}
      >
        <div
          className="container"
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
              }}
            >
              <ArrowLeft size={16} /> 목록으로
            </Link>
            <span style={{ color: 'var(--colors-hairline)' }}>|</span>
            <span style={{ fontSize: '14px', color: 'var(--colors-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="badge badge-cream" style={{ padding: '2px 8px', fontSize: '11px' }}>
                {roadmap.category}
              </span>
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

            return (
              <a
                key={node.id}
                href={node.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
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
                  border: isCompleted
                    ? '1.5px solid var(--colors-success)'
                    : '1px solid var(--colors-hairline)',
                  backgroundColor: isCompleted 
                    ? 'var(--colors-surface-soft)' 
                    : 'var(--colors-surface-card)',
                  boxShadow: '0 4px 10px rgba(20, 20, 19, 0.02)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  zIndex: 10,
                  fontFamily: 'inherit',
                  transition: 'border var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast)',
                  textDecoration: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                  {isCompleted ? (
                    <CheckCircle2 size={22} className="success-icon" style={{ color: 'var(--colors-success)', flexShrink: 0 }} />
                  ) : (
                    <Play size={20} style={{ color: 'var(--colors-muted)', flexShrink: 0 }} />
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
                        fontWeight: 500,
                        color: 'var(--colors-ink)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {node.title}
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--colors-muted-soft)', flexShrink: 0 }} />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
