import React from 'react';

const InputContainer = ({ input, setInput, handleSubmit, loading }) => (
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
);

export default InputContainer; 