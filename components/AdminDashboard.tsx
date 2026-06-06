'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Move, Eye } from 'lucide-react';
import Link from 'next/link';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node as RFNode,
  Edge as RFEdge,
  NodeTypes,
  Handle,
  Position,
  Connection,
  NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

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

// 1. Custom Node definition for React Flow using project CSS variables
const CustomNode = ({ data, selected }: { data: any; selected: boolean }) => {
  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: 'var(--rounded-md)',
        border: selected ? '2px solid var(--colors-primary)' : '1px solid var(--colors-hairline)',
        backgroundColor: selected ? 'var(--colors-surface-soft)' : 'var(--colors-surface-card)',
        boxShadow: '0 2px 6px rgba(20, 20, 19, 0.02)',
        width: '220px',
        height: '65px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'left',
        cursor: 'grab',
        position: 'relative',
      }}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ background: 'var(--colors-primary)', width: '8px', height: '8px' }} 
      />
      <span
        style={{
          fontSize: '10px',
          fontWeight: 600,
          color: 'var(--colors-primary)',
          marginBottom: '2px',
        }}
      >
        {data.difficulty}
      </span>
      {selected ? (
        <input
          type="text"
          value={data.title}
          onChange={(e) => data.onTitleChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="노드 제목 입력..."
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--colors-ink)',
            width: '100%',
            border: '1px solid var(--colors-primary)',
            borderRadius: '4px',
            padding: '2px 4px',
            backgroundColor: '#fff',
            outline: 'none',
            fontFamily: 'inherit',
          }}
          autoFocus
        />
      ) : (
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--colors-ink)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '190px',
          }}
        >
          {data.title || '(제목 없음)'}
        </span>
      )}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ background: 'var(--colors-primary)', width: '8px', height: '8px' }} 
      />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

export function AdminDashboard({ initialData }: { initialData: RoadmapData }) {
  const [data, setData] = useState<RoadmapData>(initialData);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>(
    data.roadmaps[0]?.id || ''
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Status feedback
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Resizable sidebar states & logic
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (mouseMoveEvent: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - mouseMoveEvent.clientX;
      if (newWidth > 260 && newWidth < 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // React Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const selectedRoadmap = data.roadmaps.find((r) => r.id === selectedRoadmapId);
  const selectedNode = selectedRoadmap?.nodes.find((n) => n.id === selectedNodeId);

  // Sync React Flow nodes and edges with selectedRoadmap data
  useEffect(() => {
    if (!selectedRoadmap) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const rfNodes: RFNode[] = selectedRoadmap.nodes.map((node) => ({
      id: node.id,
      type: 'custom',
      position: { x: node.x, y: node.y },
      selected: selectedNodeId === node.id,
      data: {
        title: node.title,
        difficulty: node.difficulty === 'ADVANCED' ? '고급' : node.difficulty === 'INTERMEDIATE' ? '중급' : '초급',
        onTitleChange: (newTitle: string) => handleUpdateNodeField(node.id, 'title', newTitle),
        timeline: node.timeline,
      },
    }));

    const rfEdges: RFEdge[] = selectedRoadmap.nodes
      .filter((node) => node.parentId)
      .map((node) => ({
        id: `e-${node.parentId}-${node.id}`,
        source: node.parentId!,
        target: node.id,
        animated: true,
        style: { stroke: 'var(--colors-primary)', strokeWidth: 2 },
      }));

    setNodes(rfNodes);
    setEdges(rfEdges);
  }, [selectedRoadmapId, selectedRoadmap?.nodes, selectedNodeId]);

  // Helper to extract YouTube video ID
  const getYouTubeId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  const showNotification = (text: string, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 5000);
  };

  // 1. Roadmap level operations
  const handleAddRoadmap = () => {
    const newId = `roadmap-${Date.now()}`;
    const newRoadmap: Roadmap = {
      id: newId,
      title: '새로운 편집자P 로드맵',
      description: '로드맵에 대한 설명을 적어주세요.',
      category: data.categories[0] || 'AI',
      isActive: true,
      nodes: [],
    };
    
    setData({
      ...data,
      roadmaps: [...data.roadmaps, newRoadmap],
    });
    setSelectedRoadmapId(newId);
    setSelectedNodeId(null);
  };

  const handleDeleteRoadmap = (id: string) => {
    if (!confirm('정말 이 로드맵을 삭제하시겠습니까? 관련 노드가 전부 삭제됩니다.')) return;
    
    const nextRoadmaps = data.roadmaps.filter((r) => r.id !== id);
    setData({
      ...data,
      roadmaps: nextRoadmaps,
    });
    
    if (selectedRoadmapId === id) {
      setSelectedRoadmapId(nextRoadmaps[0]?.id || '');
      setSelectedNodeId(null);
    }
  };

  const handleUpdateRoadmapField = (field: keyof Roadmap, value: any) => {
    if (!selectedRoadmapId) return;
    
    setData({
      ...data,
      roadmaps: data.roadmaps.map((r) => {
        if (r.id === selectedRoadmapId) {
          return { ...r, [field]: value };
        }
        return r;
      }),
    });
  };

  // 2. Node level operations
  const handleAddNode = () => {
    if (!selectedRoadmapId || !selectedRoadmap) return;
    
    const newNodeId = `node-${Date.now()}`;
    const defaultY = selectedRoadmap.nodes.length > 0 
      ? Math.max(...selectedRoadmap.nodes.map(n => n.y)) + 120 
      : 80;

    const newNode: Node = {
      id: newNodeId,
      title: '새로운 강의 노드',
      description: '강의에 대한 간략한 설명입니다.',
      youtubeUrl: 'https://www.youtube.com/watch?v=zjkBMFhNj_g',
      youtubeId: 'zjkBMFhNj_g',
      difficulty: 'BEGINNER',
      x: 300,
      y: defaultY,
      parentId: selectedRoadmap.nodes[selectedRoadmap.nodes.length - 1]?.id || null,
    };

    setData({
      ...data,
      roadmaps: data.roadmaps.map((r) => {
        if (r.id === selectedRoadmapId) {
          return { ...r, nodes: [...r.nodes, newNode] };
        }
        return r;
      }),
    });
    setSelectedNodeId(newNodeId);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!selectedRoadmapId || !selectedRoadmap) return;
    
    setData({
      ...data,
      roadmaps: data.roadmaps.map((r) => {
        if (r.id === selectedRoadmapId) {
          return {
            ...r,
            nodes: r.nodes
              .filter((n) => n.id !== nodeId)
              .map((n) => (n.parentId === nodeId ? { ...n, parentId: null } : n)),
          };
        }
        return r;
      }),
    });

    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const handleUpdateNodeField = (nodeId: string, field: keyof Node, value: any) => {
    if (!selectedRoadmapId) return;

    let updatedValue = value;
    let extraFields = {};
    if (field === 'youtubeUrl') {
      const extractedId = getYouTubeId(value);
      extraFields = { youtubeId: extractedId };
    }

    setData({
      ...data,
      roadmaps: data.roadmaps.map((r) => {
        if (r.id === selectedRoadmapId) {
          return {
            ...r,
            nodes: r.nodes.map((n) => {
              if (n.id === nodeId) {
                return { ...n, [field]: updatedValue, ...extraFields };
              }
              return n;
            }),
          };
        }
        return r;
      }),
    });
  };

  // Sync positions when node is dragged in React Flow and snap to nearest 15px grid upon dropping, with smart alignment guides to neighbor nodes
  const onNodeDragStop = (event: React.MouseEvent, node: RFNode) => {
    let snappedX = Math.round(node.position.x / 15) * 15;
    let snappedY = Math.round(node.position.y / 15) * 15;

    // Smart Alignment Guide Snapping: alignment with other nodes
    const otherNodes = selectedRoadmap?.nodes.filter((n) => n.id !== node.id) || [];
    const ALIGN_THRESHOLD = 25; // Snap range in pixels

    // Find closest horizontal alignment (X column alignment)
    let minDiffX = ALIGN_THRESHOLD;
    otherNodes.forEach((n) => {
      const diff = Math.abs(node.position.x - n.x);
      if (diff < minDiffX) {
        minDiffX = diff;
        snappedX = n.x; // Snaps exactly to match neighbor's X coordinate
      }
    });

    // Find closest vertical alignment (Y row alignment)
    let minDiffY = ALIGN_THRESHOLD;
    otherNodes.forEach((n) => {
      const diff = Math.abs(node.position.y - n.y);
      if (diff < minDiffY) {
        minDiffY = diff;
        snappedY = n.y; // Snaps exactly to match neighbor's Y coordinate
      }
    });

    // 1. Force the React Flow local node element state to snap immediately in UI
    setNodes((prevNodes) =>
      prevNodes.map((n) =>
        n.id === node.id
          ? { ...n, position: { x: snappedX, y: snappedY } }
          : n
      )
    );

    // 2. Save snapped coordinates to the database dataset
    setData((prev) => ({
      ...prev,
      roadmaps: prev.roadmaps.map((r) => {
        if (r.id === selectedRoadmapId) {
          return {
            ...r,
            nodes: r.nodes.map((n) => {
              if (n.id === node.id) {
                return { 
                  ...n, 
                  x: snappedX, 
                  y: snappedY 
                };
              }
              return n;
            }),
          };
        }
        return r;
      }),
    }));
  };

  // Handle new connection setup by dragging edges
  const onConnect = (connection: Connection) => {
    const { source, target } = connection;
    if (!source || !target) return;

    setData((prev) => ({
      ...prev,
      roadmaps: prev.roadmaps.map((r) => {
        if (r.id === selectedRoadmapId) {
          return {
            ...r,
            nodes: r.nodes.map((n) => {
              if (n.id === target) {
                return { ...n, parentId: source };
              }
              return n;
            }),
          };
        }
        return r;
      }),
    }));
  };

  // Handle reconnecting existing edges to different nodes
  const onEdgeUpdate = (oldEdge: RFEdge, newConnection: Connection) => {
    const { source, target } = newConnection;
    if (!source || !target) return;

    setData((prev) => ({
      ...prev,
      roadmaps: prev.roadmaps.map((r) => {
        if (r.id === selectedRoadmapId) {
          return {
            ...r,
            nodes: r.nodes.map((n) => {
              if (n.id === target) {
                return { ...n, parentId: source };
              }
              if (n.id === oldEdge.target && oldEdge.target !== target) {
                return { ...n, parentId: null };
              }
              return n;
            }),
          };
        }
        return r;
      }),
    }));
  };




  // 3. Auto Layout Spacing (Clean Tree Spacing)
  const handleAutoLayout = () => {
    if (!selectedRoadmap || selectedRoadmap.nodes.length === 0) return;

    const nodes = [...selectedRoadmap.nodes];
    const adjMap: { [key: string]: string[] } = {};
    const roots: string[] = [];

    nodes.forEach((n) => {
      if (!n.parentId) {
        roots.push(n.id);
      } else {
        if (!adjMap[n.parentId]) adjMap[n.parentId] = [];
        adjMap[n.parentId].push(n.id);
      }
    });

    const levels: { [key: string]: number } = {};
    const levelNodes: { [level: number]: string[] } = {};

    const traverse = (nodeId: string, depth: number) => {
      levels[nodeId] = depth;
      if (!levelNodes[depth]) levelNodes[depth] = [];
      if (!levelNodes[depth].includes(nodeId)) {
        levelNodes[depth].push(nodeId);
      }

      const children = adjMap[nodeId] || [];
      children.forEach((childId) => traverse(childId, depth + 1));
    };

    roots.forEach((r) => traverse(r, 0));

    // Handle any unreachable nodes from roots (cycles/islands)
    nodes.forEach((n) => {
      if (levels[n.id] === undefined) {
        levels[n.id] = 0;
        if (!levelNodes[0]) levelNodes[0] = [];
        levelNodes[0].push(n.id);
      }
    });

    const updatedNodes = nodes.map((n) => {
      const depth = levels[n.id] || 0;
      // Standard vertical height gap of 150px (multiple of 15)
      const y = depth * 150 + 75; // 75 is also a multiple of 15 (15 * 5)

      const idxList = levelNodes[depth] || [n.id];
      const idx = idxList.indexOf(n.id);
      const totalInLevel = idxList.length;

      // Centered horizontal spacing of 270px (multiple of 15)
      const startX = 300 - ((totalInLevel - 1) * 270) / 2; // 300 and 135 are multiples of 15, yielding multiples of 15
      const x = startX + idx * 270;

      return { ...n, x, y };
    });

    setData((prev) => ({
      ...prev,
      roadmaps: prev.roadmaps.map((r) => {
        if (r.id === selectedRoadmapId) {
          return { ...r, nodes: updatedNodes };
        }
        return r;
      }),
    }));
    showNotification('노드들의 간격이 자동으로 맞추어졌습니다.');
  };

  // 4. Save to backend (API call)
  const handleSaveData = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/save-roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || '저장에 실패했습니다.');
      }
      showNotification(result.message || '변경사항이 정상 저장되었습니다.');
    } catch (err: any) {
      showNotification(err.message, true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 'calc(100vh - 64px)' }}>
      {/* Admin Action Bar */}
      <div
        style={{
          borderBottom: '1px solid var(--colors-hairline)',
          backgroundColor: 'var(--colors-surface-soft)',
          padding: '12px var(--spacing-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ fontSize: '24px', margin: 0, fontWeight: 600 }}>
            관리자 대시보드
          </h2>
          {message && (
            <span
              style={{
                fontSize: '13px',
                padding: '4px 12px',
                borderRadius: 'var(--rounded-md)',
                backgroundColor: message.isError ? '#fde8e8' : '#eafaf1',
                color: message.isError ? 'var(--colors-error)' : 'var(--colors-success)',
                border: `1px solid ${message.isError ? '#fcd4d4' : '#d1f2e1'}`,
              }}
            >
              {message.text}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleAutoLayout}
            className="btn btn-secondary"
            style={{ height: '36px', gap: '6px' }}
          >
            ✨ 간격 자동 정렬
          </button>
          <Link href="/" className="btn btn-secondary" style={{ height: '36px' }}>
            <Eye size={16} style={{ marginRight: '6px' }} /> 실제 사이트 보기
          </Link>
          <button
            onClick={handleSaveData}
            disabled={isSaving}
            className="btn btn-primary"
            style={{ height: '36px', gap: '8px' }}
          >
            <Save size={16} /> {isSaving ? '저장 중...' : '변경사항 저장'}
          </button>
        </div>
      </div>

      {/* Editor Layout Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr auto',
          flex: 1,
          backgroundColor: 'var(--colors-canvas)',
        }}
      >
        {/* 1. Left Column: Roadmaps list */}
        <div
          style={{
            borderRight: '1px solid var(--colors-hairline)',
            padding: '16px',
            backgroundColor: 'var(--colors-canvas)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--colors-ink)' }}>로드맵 목록</h3>
            <button
              onClick={handleAddRoadmap}
              className="btn btn-secondary"
              style={{ padding: '0 8px', height: '28px', fontSize: '12px' }}
            >
              <Plus size={14} /> 추가
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
            {data.roadmaps.map((r) => {
              const isSelected = r.id === selectedRoadmapId;
              return (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedRoadmapId(r.id);
                    setSelectedNodeId(null);
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--rounded-md)',
                    backgroundColor: isSelected ? 'var(--colors-surface-card)' : 'transparent',
                    border: '1px solid ' + (isSelected ? 'var(--colors-hairline)' : 'transparent'),
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: isSelected ? 600 : 400,
                      color: 'var(--colors-ink)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '160px',
                    }}
                  >
                    {r.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRoadmap(r.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--colors-muted-soft)',
                    }}
                  >
                    <Trash2 size={13} className="btn-text" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Middle Column: Live React Flow Canvas */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--colors-hairline)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--colors-hairline-soft)',
              backgroundColor: 'var(--colors-surface-soft)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--colors-muted)' }}>
              비주얼 드래그 에디터 (드래그하여 배치 조절, 노드 클릭 시 편집)
            </span>
            <button
              onClick={handleAddNode}
              disabled={!selectedRoadmapId}
              className="btn btn-secondary"
              style={{ height: '28px', fontSize: '12px', padding: '0 10px' }}
            >
              <Plus size={14} style={{ marginRight: '4px' }} /> 새 노드 추가
            </button>
          </div>

          {selectedRoadmap ? (
            <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={(event, node) => setSelectedNodeId(node.id)}
                onPaneClick={() => setSelectedNodeId(null)}
                onNodeDragStop={onNodeDragStop}
                onConnect={onConnect}
                onEdgeUpdate={onEdgeUpdate}
                snapToGrid={true}
                snapGrid={[15, 15]}
                fitView
                fitViewOptions={{ padding: 0.2 }}
              >
                <Background color="var(--colors-hairline)" gap={16} size={1} />
                <Controls />
              </ReactFlow>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'var(--colors-muted)' }}>로드맵을 선택하거나 추가해주세요.</p>
            </div>
          )}
        </div>

        {/* 3. Right Column: Configuration Forms (Tabbed Layout) */}
        <div
          style={{
            width: `${sidebarWidth}px`,
            position: 'relative',
            borderLeft: '1px solid var(--colors-hairline)',
            backgroundColor: 'var(--colors-canvas)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Draggable resize handler splitter on the left border line */}
          <div
            onMouseDown={startResizing}
            style={{
              position: 'absolute',
              top: 0,
              left: '-4px',
              width: '8px',
              height: '100%',
              cursor: 'col-resize',
              zIndex: 50,
              backgroundColor: isResizing ? 'var(--colors-primary)' : 'transparent',
              transition: 'background-color 0.2s',
            }}
            title="드래그하여 패널 너비 조절"
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              height: '100%',
              padding: '16px',
              overflow: 'hidden',
            }}
          >
          {selectedRoadmap ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              {/* Form switching tabs */}
              <div 
                style={{ 
                  display: 'flex', 
                  borderBottom: '1px solid var(--colors-hairline-soft)', 
                  marginBottom: '16px',
                  gap: '4px'
                }}
              >
                <button
                  onClick={() => setSelectedNodeId(null)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    border: 'none',
                    borderBottom: !selectedNodeId ? '2px solid var(--colors-primary)' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    color: !selectedNodeId ? 'var(--colors-ink)' : 'var(--colors-muted-soft)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  로드맵 설정
                </button>
                <button
                  disabled={!selectedNodeId}
                  onClick={() => {}}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    border: 'none',
                    borderBottom: selectedNodeId ? '2px solid var(--colors-primary)' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    color: selectedNodeId ? 'var(--colors-ink)' : 'var(--colors-muted-soft)',
                    opacity: !selectedNodeId ? 0.4 : 1,
                    cursor: selectedNodeId ? 'pointer' : 'not-allowed',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  노드 설정 {selectedNodeId ? '✦' : ''}
                </button>
              </div>

              {/* Scrollable Form Content Area */}
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                {!selectedNodeId ? (
                  /* Roadmap Settings */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                        style={{ height: '80px', padding: '8px 12px', resize: 'both' }}
                        value={selectedRoadmap.description}
                        onChange={(e) => handleUpdateRoadmapField('description', e.target.value)}
                      />
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
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedRoadmap.isActive !== false}
                          onChange={(e) => handleUpdateRoadmapField('isActive', e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--colors-primary)' }}
                        />
                        노출 활성화
                      </label>
                    </div>
                  </div>
                ) : (
                  /* Selected Node Settings */
                  selectedNode && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--colors-muted)', fontWeight: 500 }}>
                          ID: {selectedNode.id}
                        </span>
                        <button
                          onClick={() => handleDeleteNode(selectedNode.id)}
                          className="btn-text"
                          style={{ color: 'var(--colors-error)', fontSize: '12px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={13} /> 노드 삭제
                        </button>
                      </div>

                      <div className="form-group">
                        <label className="form-label">노드 제목</label>
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
                        {selectedNode.youtubeId && (
                          <div style={{ fontSize: '11px', color: 'var(--colors-success)', marginTop: '4px' }}>
                            ID 자동 추출: {selectedNode.youtubeId}
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">강의 요약</label>
                        <textarea
                          className="input-text"
                          style={{ height: '80px', padding: '8px 12px', resize: 'both' }}
                          value={selectedNode.description || ''}
                          onChange={(e) => handleUpdateNodeField(selectedNode.id, 'description', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">선행 학습 노드 (Parent)</label>
                        <select
                          className="input-text"
                          style={{ padding: '0 8px' }}
                          value={selectedNode.parentId || ''}
                          onChange={(e) => handleUpdateNodeField(selectedNode.id, 'parentId', e.target.value || null)}
                        >
                          <option value="">(선행 학습 없음)</option>
                          {selectedRoadmap.nodes
                            .filter((n) => n.id !== selectedNode.id)
                            .map((n) => (
                              <option key={n.id} value={n.id}>
                                {n.title}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">난이도</label>
                        <select
                          className="input-text"
                          style={{ padding: '0 8px' }}
                          value={selectedNode.difficulty}
                          onChange={(e) => handleUpdateNodeField(selectedNode.id, 'difficulty', e.target.value)}
                        >
                          <option value="BEGINNER">초급</option>
                          <option value="INTERMEDIATE">중급</option>
                          <option value="ADVANCED">고급</option>
                        </select>
                      </div>

                      {/* Timeline Items Editor */}
                      <div style={{ marginTop: '16px', borderTop: '1px solid var(--colors-hairline-soft)', paddingTop: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <label className="form-label" style={{ margin: 0 }}>강의 타임라인 (분량 요약)</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={async () => {
                                if (!selectedNode.youtubeId) {
                                  alert('유튜브 영상 ID 혹은 링크를 먼저 정확하게 입력해주세요.');
                                  return;
                                }
                                try {
                                  const res = await fetch(`/api/admin/youtube-timeline?videoId=${selectedNode.youtubeId}`);
                                  if (!res.ok) throw new Error('타임라인 가져오기 실패');
                                  const fetchedTimeline = await res.json();
                                  if (fetchedTimeline.error) {
                                    alert(fetchedTimeline.error);
                                    return;
                                  }
                                  if (fetchedTimeline.length === 0) {
                                    alert('설명란에서 00:00과 같은 타임라인 형식을 찾지 못했습니다.');
                                    return;
                                  }
                                  handleUpdateNodeField(selectedNode.id, 'timeline', fetchedTimeline);
                                } catch (e) {
                                  alert('타임라인을 가져오는 도중 오류가 발생했습니다.');
                                }
                              }}
                              className="btn-text"
                              style={{ color: 'var(--colors-accent-teal)', fontSize: '12px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}
                            >
                              🔗 불러오기
                            </button>
                            <button
                              onClick={() => {
                                const currentTimeline = selectedNode.timeline || [];
                                const updatedTimeline = [...currentTimeline, { time: '00:00', title: '새 챕터' }];
                                handleUpdateNodeField(selectedNode.id, 'timeline', updatedTimeline);
                              }}
                              className="btn-text"
                              style={{ color: 'var(--colors-primary)', fontSize: '12px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}
                            >
                              + 추가
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(selectedNode.timeline || []).map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <input
                                type="text"
                                className="input-text"
                                style={{ width: '75px', padding: '4px 6px', textAlign: 'center', fontSize: '12px' }}
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
                                style={{ flex: 1, padding: '4px 6px', fontSize: '12px' }}
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
                                onClick={() => {
                                  const updated = (selectedNode.timeline || []).filter((_, i) => i !== idx);
                                  handleUpdateNodeField(selectedNode.id, 'timeline', updated);
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--colors-error)', padding: '4px' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}

                          {(selectedNode.timeline || []).length === 0 && (
                            <span style={{ fontSize: '12px', color: 'var(--colors-muted-soft)', textAlign: 'center', padding: '8px 0' }}>
                              등록된 타임라인이 없습니다. 우측 상단 '추가' 버튼을 눌러보세요.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ color: 'var(--colors-muted)' }}>로드맵을 만들어 관리를 시작하세요.</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
