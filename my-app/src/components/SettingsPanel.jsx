import React from 'react';

const SettingsPanel = ({
  showSettings,
  maxTokens,
  handleMaxTokensChange,
  selectedModel,
  handleModelChange,
  customApiKey,
  handleApiKeyChange,
  customUrl,
  handleUrlChange,
  customModelName,
  handleModelNameChange,
}) => {
  if (!showSettings) return null;

  return (
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
  );
};

export default SettingsPanel; 