import React from 'react';

const SelectionHint = ({ selectedParentId }) => (
  <div className="selection-hint" style={{ position: 'absolute', top: 0, left: 0, padding: '10px' }}>
    {selectedParentId
      ? `将在节点 "${selectedParentId}" 下添加分支`
      : '未选择节点，将添加到最后节点'}
  </div>
);

export default SelectionHint; 