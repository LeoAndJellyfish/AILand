export const initialNodes = [
  {
    id: '1',
    data: { label: '你: 你好' },
    className: 'user-node',
    position: { x: 0, y: 0 },
  },
  {
    id: '2',
    data: { label: 'AI: 你好！请问我可以帮您什么？' },
    className: 'ai-node',
    position: { x: 0, y: 100 },
  },
];

export const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];