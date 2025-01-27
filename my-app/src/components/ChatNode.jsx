import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const ChatNode = memo(({ data, isConnectable, className }) => {
  return (
    <div className={`chat-node ${className}`}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <div className="chat-content">{data.label}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </div>
  );
});

export default ChatNode; 