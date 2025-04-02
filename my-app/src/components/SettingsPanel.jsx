import React from 'react';
import { modelConfigs } from '../config/modelConfig';

const SettingsPanel = ({
  showSettings,
  maxTokens,
  handleMaxTokensChange,
  selectedModel,
  handleModelChange,
  customConfig,
  onCustomChange,
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
          {modelConfigs.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
          <option value="custom">自定义</option>
        </select>
      </label>
      {selectedModel === 'custom' && (
        <>
          <label>
            API Key:
            <input
              type="text"
              value={customConfig.apiKey}
              onChange={(e) => onCustomChange('apiKey', e.target.value)}
              placeholder="输入自定义 API Key"
            />
          </label>
          <label>
            URL:
            <input
              type="text"
              value={customConfig.url}
              onChange={(e) => onCustomChange('url', e.target.value)}
              placeholder="输入自定义 URL"
            />
          </label>
          <label>
            模型名称:
            <input
              type="text"
              value={customConfig.modelName}
              onChange={(e) => onCustomChange('modelName', e.target.value)}
              placeholder="输入自定义模型名称"
            />
          </label>
        </>
      )}
    </div>
  );
};

export default SettingsPanel; 