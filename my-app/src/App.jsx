import React, { useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  {
    id: '1',
    position: { x: 0, y: 0 },
    data: { label: '你: 你好，能介绍一下AI吗？' },
    style: { background: '#6366f1', color: 'white' },
  },
  {
    id: '2',
    position: { x: 0, y: 100 },
    data: { label: 'AI: 当然！人工智能是...' },
    style: { background: '#22c55e', color: 'white' },
  },
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

const DialogFlow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [newMessage, setNewMessage] = useState('');
  const [lastNodeId, setLastNodeId] = useState('2');
  const [isSubmitting, setIsSubmitting] = useState(false); // 新增提交状态

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSubmitting) return;

    setIsSubmitting(true); // 开始提交时禁用按钮
    const userId = `user-${Date.now()}`;
    const aiId = `ai-${Date.now()}`;
    
    const newUserNode = {
      id: userId,
      position: { x: 0, y: nodes[nodes.length-1].position.y + 150 },
      data: { label: `你: ${newMessage}` },
      style: { background: '#6366f1', color: 'white' }
    };

    const tempAiNode = {
      id: aiId,
      position: { x: 0, y: newUserNode.position.y + 100 },
      data: { label: 'AI: 思考中...' },
      style: { background: '#22c55e', color: 'white' }
    };

    setNodes(nds => nds.concat([newUserNode, tempAiNode]));
    setEdges(eds => addEdge({
      id: `e-${lastNodeId}-${userId}`,
      source: lastNodeId,
      target: userId
    }, addEdge({
      id: `e-${userId}-${aiId}`,
      source: userId,
      target: aiId
    }, eds)));

    setNewMessage(''); // 立即清空输入框

    try {
      const aiResponse = await callOpenAI(newMessage);
      
      setNodes(nds => nds.map(node => 
        node.id === aiId ? {
          ...node,
          data: { label: `AI: ${aiResponse}` },
          style: { ...node.style, background: '#22c55e' }
        } : node
      ));
      setLastNodeId(aiId);
    } catch (error) {
      setNodes(nds => nds.map(node => 
        node.id === aiId ? {
          ...node,
          data: { label: 'AI: 请求失败，请重试' },
          style: { ...node.style, background: '#ef4444' }
        } : node
      ));
    } finally {
      setIsSubmitting(false); // 无论成功失败都恢复按钮状态
    }
  };

  const callOpenAI = async (message) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`这是对【${message}】的模拟回复`);
      }, 1500);
    });
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      <div style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%',
        maxWidth: 600,
        display: 'flex',
        gap: 10,
        zIndex: 10
      }}>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="输入你的问题..."
          disabled={isSubmitting} // 输入框禁用状态
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 8,
            border: `2px solid ${isSubmitting ? '#94a3b8' : '#6366f1'}`,
            outline: 'none',
            fontSize: 16,
            color: 'black',
            backgroundColor: isSubmitting ? '#f1f5f9' : 'white',
            cursor: isSubmitting ? 'not-allowed' : 'auto'
          }}
          onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && handleSubmit(e)}
        />
        <button
          onClick={handleSubmit}
          disabled={isSubmitting} // 按钮禁用状态
          style={{
            padding: '12px 24px',
            background: isSubmitting ? '#94a3b8' : '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            transition: 'background 0.3s',
            ':hover': {
              background: isSubmitting ? '#94a3b8' : '#4f46e5'
            }
          }}
        >
          {isSubmitting ? '回复中...' : '发送'}
        </button>
      </div>
    </div>
  );
};

export default DialogFlow;