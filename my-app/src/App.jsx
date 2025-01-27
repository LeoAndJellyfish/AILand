import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  addEdge,
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
import ChatNode from './components/ChatNode';
import { initialEdges, initialNodes } from './initialData';
import { applyLayout } from './layoutUtils';

const nodeTypes = {
  chatNode: ChatNode,
};

const DialogFlow = () => {
  const nodeSizeMap = useRef({});  // 保存节点尺寸
  const [nodes, setNodes] = useNodesState(applyLayout(initialNodes, initialEdges,nodeSizeMap));
  const [edges, setEdges] = useEdgesState(initialEdges);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const { setCenter } = useReactFlow(); // 获取视图控制方法
  const [showSettings, setShowSettings] = useState(false);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [selectedModel, setSelectedModel] = useState('01AI'); // 新增状态用于选择模型
  const [customApiKey, setCustomApiKey] = useState(''); // 新增状态用于自定义 API 密钥
  const [customUrl, setCustomUrl] = useState(''); // 新增状态用于自定义 URL
  const [customModelName, setCustomModelName] = useState(''); // 新增状态用于自定义模型名称

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

  const handleSettingsToggle = () => {
    setShowSettings(prev => !prev);
  };

  const handleMaxTokensChange = (e) => {
    setMaxTokens(Number(e.target.value));
  };

  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
  };

  const handleApiKeyChange = (e) => {
    setCustomApiKey(e.target.value);
  };

  const handleUrlChange = (e) => {
    setCustomUrl(e.target.value);
  };

  const handleModelNameChange = (e) => {
    setCustomModelName(e.target.value);
  };

  // 处理连接的函数
  const onConnect = useCallback((params) => {
    setEdges((eds) => {
      const newEdges = addEdge(params, eds);
      // 在连边后重新排版节点
      setNodes((nds) => applyLayout(nds, newEdges, nodeSizeMap));
      return newEdges;
    });
  }, [setEdges, setNodes]);

  const onEdgeUpdate = useCallback((oldEdge, newConnection) => {
    setEdges((eds) => addEdge(newConnection, eds.filter((e) => e.id !== oldEdge.id)));
  }, [setEdges]);

  const onEdgeUpdateEnd = useCallback((_, edge) => {
    // 如果用户取消了连接，删除该边
    setEdges((eds) => {
      const updatedEdges = eds.filter((e) => e.id !== edge.id);
      // 在取消连边后重新排版节点
      setNodes((nds) => applyLayout(nds, updatedEdges, nodeSizeMap));
      return updatedEdges;
    });
  }, [setEdges, setNodes]);

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
        type: 'chatNode',
        data: { label: `你: ${input}` },
        className: 'user-node',
      },
      {
        id: `ai-${newId}`,
        type: 'chatNode',
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

    // 根据选择的模型设置 API 配置
    const apiConfig = selectedModel === '01AI'
      ? {
          url: 'https://api.lingyiwanwu.com/v1/chat/completions',
          model: 'yi-lightning',
          apiKey: 'a0fbf48ae1a040c0bcca6cc88b328c53',
        }
      : selectedModel === 'deepseek'
      ? {
          url: 'https://api.deepseek.com/chat/completions',
          model: 'deepseek-chat',
          apiKey: 'sk-a4ad50ad0771424db5ef16c46f941dbf',
        }
      : {
          url: customUrl,
          model: customModelName,
          apiKey: customApiKey,
        };

    try {
      const response = await fetch(apiConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: apiConfig.model,
          messages,
          temperature: 0.3,
          max_tokens: maxTokens,
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
          type: 'chatNode',
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
        onConnect={onConnect}
        onEdgeUpdate={onEdgeUpdate}
        onEdgeUpdateEnd={onEdgeUpdateEnd}
        nodeTypes={nodeTypes}
        connectable={true}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      <button className="settings-button" onClick={handleSettingsToggle}>
        设置
      </button>
      {showSettings && (
        <div className="settings-panel">
          <label>
            Max Tokens:
            <input
              type="number"
              value={maxTokens}
              onChange={handleMaxTokensChange}
              min="1"
              max="1000"
            />
          </label>
          <label>
            使用模型:
            <select value={selectedModel} onChange={handleModelChange}>
              <option value="01AI">01AI</option>
              <option value="deepseek">deepseek</option>
              <option value="custom">自定义</option>
            </select>
          </label>
          {selectedModel === 'custom' && (
            <>
              <label>
                API Key:
                <input
                  type="text"
                  value={customApiKey}
                  onChange={handleApiKeyChange}
                  placeholder="输入自定义 API Key"
                />
              </label>
              <label>
                URL:
                <input
                  type="text"
                  value={customUrl}
                  onChange={handleUrlChange}
                  placeholder="输入自定义 URL"
                />
              </label>
              <label>
                模型名称:
                <input
                  type="text"
                  value={customModelName}
                  onChange={handleModelNameChange}
                  placeholder="输入自定义模型名称"
                />
              </label>
            </>
          )}
        </div>
      )}
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