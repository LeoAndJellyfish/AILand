import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Handle, Position } from 'reactflow';

const ChatNode = memo(({ data }) => {
  // 从 label 中提取角色和内容
  const [role, content] = data.label.split(': ', 2);
  
  return (
    <div className="chat-node">
      <Handle type="target" position={Position.Top} />
      <div className="node-content">
        <strong>{role}: </strong>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

export default ChatNode; 