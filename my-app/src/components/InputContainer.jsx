import React, { useRef } from 'react';

const InputContainer = ({ input, setInput, handleSubmit, loading, handleFileUpload }) => {
  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
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
      <button type="button" onClick={handleButtonClick} className="upload-button">
          上传文件
        </button>
        <input
          type="file"
          accept=".txt,.md,.docx"
          onChange={handleFileUpload}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
    </div>
  );
};
export default InputContainer; 