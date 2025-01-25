import React, { useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';

const initialNodes = [
  {
    id: '1',
    position: { x: 0, y: 0 },
    data: { label: '你: 你好，能介绍一下AI吗？' },
    className: 'user-node',
  },
  {
    id: '2',
    position: { x: 0, y: 100 },
    data: { label: 'AI: 当然！人工智能是...' },
    className: 'ai-node',
  },
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

const DialogFlow = () => {
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    const newId = Date.now();
    const lastY = nodes[nodes.length-1].position.y;

    const newNodes = [
      ...nodes,
      { 
        id: `u-${newId}`,
        position: { x: 0, y: lastY + 150 },
        data: { label: `你: ${input}` },
        className: 'user-node'
      },
      { 
        id: `ai-${newId}`,
        position: { x: 0, y: lastY + 250 },
        data: { label: 'AI: 思考中...' },
        className: 'ai-node'
      }
    ];

    const newEdges = [
      ...edges,
      { id: `e-${nodes.length}-u`, source: nodes[nodes.length-1].id, target: `u-${newId}` },
      { id: `e-u-ai`, source: `u-${newId}`, target: `ai-${newId}` }
    ];

    setNodes(newNodes);
    setEdges(newEdges);
    setInput('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setNodes(nodes => nodes.map(n => 
        n.id === `ai-${newId}` ? { 
          ...n, 
          data: { label: `AI: 这是对【${input}】的回复` },
          className: 'ai-node'
        } : n
      ));
    } catch {
      setNodes(nodes => nodes.map(n => 
        n.id === `ai-${newId}` ? { 
          ...n, 
          data: { label: 'AI: 请求失败，请重试' },
          className: 'error-node'
        } : n
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dialog-container">
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      <div className="input-container">
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

export default DialogFlow;