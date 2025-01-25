import dagre from 'dagre';
import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';

// 初始节点和边
const initialNodes = [
  {
    id: '1',
    data: { label: '你: 你好，能介绍一下AI吗？' },
    className: 'user-node',
    position: { x: 0, y: 0 },
  },
  {
    id: '2',
    data: { label: 'AI: 当然！人工智能是...' },
    className: 'ai-node',
    position: { x: 0, y: 100 },
  },
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

// 创建布局算法函数
const applyLayout = (nodes, edges) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 100 });

  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: 200, height: 50 });
  });

  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 100,
        y: nodeWithPosition.y,
      },
      targetPosition: 'top',
      sourcePosition: 'bottom',
    };
  });
};

const DialogFlow = () => {
  const [nodes, setNodes] = useNodesState(applyLayout(initialNodes, initialEdges));
  const [edges, setEdges] = useEdgesState(initialEdges);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const { setCenter } = useReactFlow(); // 获取视图控制方法
  // 节点点击高亮逻辑
  const handleNodeClick = useCallback((_, node) => {
    setSelectedParentId(prev => (prev === node.id ? null : node.id));
  }, []);

  // 提交逻辑
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    const newId = Date.now().toString();
    const parentId = selectedParentId || nodes[nodes.length - 1].id;

    const newNodes = [
      ...nodes,
      {
        id: `u-${newId}`,
        data: { label: `你: ${input}` },
        className: 'user-node',
      },
      {
        id: `ai-${newId}`,
        data: { label: 'AI: 思考中...' },
        className: 'ai-node',
      },
    ];

    const newEdges = [
      ...edges,
      { id: `e-${parentId}-u-${newId}`, source: parentId, target: `u-${newId}` },
      { id: `e-u-ai-${newId}`, source: `u-${newId}`, target: `ai-${newId}` },
    ];

    const updatedNodes = applyLayout(newNodes, newEdges);
    setNodes(updatedNodes);
    setEdges(newEdges);
    setInput('');
    setSelectedParentId(null);
    // 查找最新添加的AI节点
    const aiNode = updatedNodes.find(n => n.id === `ai-${newId}`);
    if (aiNode) {
      // 计算节点中心坐标（考虑节点尺寸）
      const nodeCenterX = aiNode.position.x + 100; // 节点宽度200/2
      const nodeCenterY = aiNode.position.y + 25;  // 节点高度50/2
      
      // 平滑滚动到节点中心
      setCenter(nodeCenterX, nodeCenterY, {
        duration: 800,      // 动画持续时间
      });
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setNodes(nodes =>
        nodes.map(n =>
          n.id === `ai-${newId}`
            ? {
                ...n,
                data: { label: `AI: 这是对【${input}】的回复` },
                className: 'ai-node',
              }
            : n
        )
      );
    } catch {
      setNodes(nodes =>
        nodes.map(n =>
          n.id === `ai-${newId}`
            ? {
                ...n,
                data: { label: 'AI: 请求失败，请重试' },
                className: 'error-node',
              }
            : n
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // 根据选中节点动态更新节点样式
  const styledNodes = nodes.map(node => ({
    ...node,
    className: `${node.className} ${node.id === selectedParentId ? 'selected-node' : ''}`,
  }));

  return (
    <div className="dialog-container">
      <ReactFlow
        nodes={styledNodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        connectable={false}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      <div className="input-container">
        <div className="selection-hint">
          {selectedParentId
            ? `将在节点 "${selectedParentId}" 下添加分支`
            : '未选择节点，将添加到最后节点'}
        </div>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="输入问题..."
          className="dialog-input"
          disabled={loading}
          onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
        />
        <button
          onClick={handleSubmit}
          className="dialog-button"
          disabled={loading}
        >
          {loading ? '回复中...' : '发送'}
        </button>
      </div>
    </div>
  );
};

// 用 ReactFlowProvider 包裹整个应用
const App = () => {
  return (
    <ReactFlowProvider>
      <DialogFlow />
    </ReactFlowProvider>
  );
};

export default App;