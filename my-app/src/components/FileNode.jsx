import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const FileNode = memo(({ data }) => {
  return (
    <div className="file-node">
        <div className="node-content">
            <strong>{data.fileName}</strong>
        </div>
        <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

export default FileNode; 