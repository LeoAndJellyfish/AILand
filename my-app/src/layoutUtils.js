import dagre from 'dagre';

export const applyLayout = (nodes, edges, nodeSizeMap) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 200, ranksep: 50 });

  nodes.forEach(node => {
    // 使用存储的尺寸或默认尺寸
    const size = nodeSizeMap.current[node.id] || { width: 200, height: 80 };
    dagreGraph.setNode(node.id, { width: size.width, height: size.height });
  });

  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);
  
  return nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - (nodeSizeMap.current[node.id]?.width || 200) / 2,
        y: nodeWithPosition.y - (nodeSizeMap.current[node.id]?.height || 80) / 2,
      },
      targetPosition: 'top',
      sourcePosition: 'bottom',
    };
  });
}; 