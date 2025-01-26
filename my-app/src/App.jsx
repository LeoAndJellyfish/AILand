import dagre from 'dagre';
import React, { useCallback, useRef, useState } from 'react';
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
    data: { label: '你: 你好' },
    className: 'user-node',
    position: { x: 0, y: 0 },
  },
  {
    id: '2',
    data: { label: 'AI: 你好！请问我可以帮您什么？' },
    className: 'ai-node',
    position: { x: 0, y: 100 },
  },
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

// 创建布局算法函数
const applyLayout = (nodes, edges, nodeSizeMap) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 200, ranksep: 100 });

  nodes.forEach(node => {
    // 使用存储的尺寸或默认尺寸
    const size = nodeSizeMap.current[node.id] || { width: 200, height: 80 };
    dagreGraph.setNode(node.id, { width: size.width, height: size.height });
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
        x: nodeWithPosition.x - (nodeSizeMap.current[node.id]?.width || 200) / 2,
        y: nodeWithPosition.y - (nodeSizeMap.current[node.id]?.height || 80) / 2,
      },
      targetPosition: 'top',
      sourcePosition: 'bottom',
    };
  });
};

const DialogFlow = () => {
  const nodeSizeMap = useRef({});  // 保存节点尺寸
  const [nodes, setNodes] = useNodesState(applyLayout(initialNodes, initialEdges,nodeSizeMap));
  const [edges, setEdges] = useEdgesState(initialEdges);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const { setCenter } = useReactFlow(); // 获取视图控制方法

  const onNodesChange = useCallback((changes) => {
    changes.forEach(change => {
      if (change.type === 'position' || change.type === 'dimensions') {
        const element = document.querySelector(`[data-id="${change.id}"]`);
        if (element) {
          const { offsetWidth: width, offsetHeight: height } = element;
          nodeSizeMap.current[change.id] = { width, height };
        }
      }
    });
    //调试输出
    //console.log(nodeSizeMap.current);
  }, []);

  // 提取从根节点到选中节点的对话历史
  const extractDialogHistory = useCallback((parentId) => {
    const history = [];
    let currentId = parentId;
    while (currentId) {
      const node = nodes.find(n => n.id === currentId);
      if (node) {
        history.unshift(node.data.label);
        const edge = edges.find(e => e.target === currentId);
        currentId = edge ? edge.source : null;
      } else {
        currentId = null;
      }
    }
    return history;
  }, [nodes, edges]);

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

    const updatedNodes = applyLayout(newNodes, newEdges, nodeSizeMap);
    setNodes(updatedNodes);
    setEdges(newEdges);
    setInput('');
    setSelectedParentId(null);

    // 查找最新添加的AI节点
    const aiNode = updatedNodes.find(n => n.id === `ai-${newId}`);
    if (aiNode) {
      // 计算节点中心坐标（考虑节点尺寸）
      const nodeCenterX = aiNode.position.x + 75;
      const nodeCenterY = aiNode.position.y + 50;
      
      // 平滑滚动到节点中心
      setCenter(nodeCenterX, nodeCenterY, {
        duration: 800,      // 动画持续时间
      });
    }
  
    const dialogHistory = extractDialogHistory(parentId);
    const messages = dialogHistory.map(text => {
      const [role, content] = text.split(': ', 2);
      return { role: role === '你' ? 'user' : 'assistant', content };
    });
    messages.push({ role: 'user', content: input });

    try {
      const response = await fetch('https://api.lingyiwanwu.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer a0fbf48ae1a040c0bcca6cc88b328c53`,
        },
        body: JSON.stringify({
          model: 'yi-lightning',
          messages,
          temperature: 0.3,
          max_tokens: 100,
        }),
      });

      const data = await response.json();
      const reply = data.choices[0]?.message?.content || 'AI: 请求失败，请重试';

      setNodes(prevNodes => {
        // 过滤掉旧的 AI 节点
        const filteredNodes = prevNodes.filter(n => n.id !== `ai-${newId}`);
        
        // 添加新的 AI 节点
        const newNode = {
          id: `ai-${newId}`,
          data: { label: `AI: ${reply}` },
          className: 'ai-node',
          position: { x: 0, y: 0 }, // 位置将通过 applyLayout 更新
        };
      
        // 返回更新后的节点数组
        return applyLayout([...filteredNodes, newNode], newEdges, nodeSizeMap);
      });
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
        onNodesChange={onNodesChange}
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