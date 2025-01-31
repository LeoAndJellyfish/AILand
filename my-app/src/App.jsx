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
import FileNode from './components/FileNode';
import InputContainer from './components/InputContainer';
import SelectionHint from './components/SelectionHint';
import SettingsPanel from './components/SettingsPanel';
import { initialEdges, initialNodes } from './initialData';
import { applyLayout } from './layoutUtils';

const nodeTypes = {
  chatNode: ChatNode,
  fileNode: FileNode,
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

  // 修改 extractDialogHistory 函数
  const extractDialogHistory = useCallback((parentId) => {
    const history = [];
    const visited = new Set(); // 用于防止循环引用
    
    // 递归获取所有父节点的对话
    const getAllPaths = (nodeId) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      
      // 获取所有指向当前节点的边
      const parentEdges = edges.filter(e => e.target === nodeId);
      
      // 如果没有父节点，将当前节点添加到历史记录
      if (parentEdges.length === 0) {
        history.push(node.data.label);
        return;
      }
      
      // 对于每个父节点，递归获取其历史记录
      parentEdges.forEach(edge => {
        getAllPaths(edge.source);
      });
      
      // 将当前节点添加到历史记录
      history.push(node.data.label);
    };
    
    getAllPaths(parentId);
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

    // 获取当前使用的模型名称
    const modelDisplay = selectedModel === '01AI' 
      ? 'Yi-Lightning'
      : selectedModel === 'deepseek' 
        ? 'Deepseek-Chat'
        : customModelName;

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
        data: { 
          label: 'AI: 思考中...',
          model: modelDisplay 
        },
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
    //console.log(dialogHistory);
    const messages = dialogHistory.map(text => {
      const [role, content] = text.split(': ', 2);
      if (role === '系统') {
        return { role: 'system', content }; // 处理系统消息
      }
      return { role: role === '你' ? 'user' : 'assistant', content };
    });
    messages.push({ role: 'user', content: input });

    // 根据选择的模型设置 API 配置
    const apiConfig = selectedModel === '01AI'
      ? {
          url: 'https://api.lingyiwanwu.com/v1/chat/completions',
          model: 'yi-lightning',
        }
      : selectedModel === 'deepseek'
      ? {
          url: 'https://api.deepseek.com/chat/completions',
          model: 'deepseek-chat',
        }
      : {
          url: customUrl,
          model: customModelName,
          apiKey: customApiKey,
        };

    try {
      if (selectedModel === 'custom') {
        // 自定义模式下直接在前端发起请求
        const response = await fetch(apiConfig.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfig.apiKey}`,
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
          const filteredNodes = prevNodes.filter(n => n.id !== `ai-${newId}`);
          
          const newNode = {
            id: `ai-${newId}`,
            type: 'chatNode',
            data: { 
              label: `AI: ${reply}`,
              model: modelDisplay  // 添加模型信息
            },
            className: 'ai-node',
            position: { x: 0, y: 0 },
          };
        
          return applyLayout([...filteredNodes, newNode], newEdges, nodeSizeMap);
        });
      } else {
        // 默认模式下请求后端
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages,
            model: apiConfig.model,
            url: apiConfig.url,
            maxTokens,
          }),
        });

        const data = await response.json();
        const reply = data.response || 'AI: 请求失败，请重试';

        setNodes(prevNodes => {
          const filteredNodes = prevNodes.filter(n => n.id !== `ai-${newId}`);
          
          const newNode = {
            id: `ai-${newId}`,
            type: 'chatNode',
            data: { 
              label: `AI: ${reply}`,
              model: modelDisplay  // 添加模型信息
            },
            className: 'ai-node',
            position: { x: 0, y: 0 },
          };
        
          return applyLayout([...filteredNodes, newNode], newEdges, nodeSizeMap);
        });
      }
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

  // 处理文件上传
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const label = `系统: 以下是用户上传的文件内容。 ${file.name} ${e.target.result}`;
      const newId = `file-${Date.now()}`;
      const fileName = file.name;

      const newNode = {
        id: newId,
        type: 'fileNode',
        data: { label, fileName },
        className: 'file-node',
        position: { x: 250, y: 250 }, // 默认位置
      };

      setNodes((nds) => applyLayout([...nds, newNode], edges, nodeSizeMap));
    };
    reader.readAsText(file);
  };

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
      <SelectionHint selectedParentId={selectedParentId} />
      <button className="settings-button" onClick={handleSettingsToggle}>
        设置
      </button>
      <SettingsPanel
        showSettings={showSettings}
        maxTokens={maxTokens}
        handleMaxTokensChange={handleMaxTokensChange}
        selectedModel={selectedModel}
        handleModelChange={handleModelChange}
        customApiKey={customApiKey}
        handleApiKeyChange={handleApiKeyChange}
        customUrl={customUrl}
        handleUrlChange={handleUrlChange}
        customModelName={customModelName}
        handleModelNameChange={handleModelNameChange}
      />
      <InputContainer
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        loading={loading}
        handleFileUpload={handleFileUpload}
      />
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