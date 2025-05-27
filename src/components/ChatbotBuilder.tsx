import './ChatbotBuilder.css';
import React, { useState, useEffect, useRef} from 'react';
import ChatbotPreview from './ChatbotPreview'; 
   
interface Rule {
  id: string;
  trigger: string;
  response: string;
  isExactMatch: boolean;
  useAI: boolean;
}

interface NodeData {
  title: string;
  content: string;
  options?: { label: string; value: string; nextNodeId?: string }[]; 
  useAI?: boolean; 
}

interface Node {
  id: string;
  type: 'start' | 'message' | 'multichoice' | 'button' | 'textinput' | 'rating';
  x: number;
  y: number;
  data: NodeData;
  outputs: string[]; 
}

interface Connection {
  id: string;
  sourceId: string;
  sourceOutput: string; 
  targetId: string;
}

interface Message {
  sender: string;
  message: string;
  isTyping?: boolean; // <-- Added this
  options?: { label: string; value: string }[];
  nodeId?: string;
}

interface NodeTypeDefinition {
    type: 'start' | 'message' | 'multichoice' | 'button' | 'textinput' | 'rating'; // Ensure this matches your node types
    label: string;
}


const ChatbotBuilder = () => {
  const [rules, setRules] = useState<Rule[]>([]); // This will now be dynamically generated for preview
  const [botName, setBotName] = useState('My Chatbot');
  const [welcomeMessage, setWelcomeMessage] = useState('Hello! How can I help you today?');
  const [fallbackMessage, setFallbackMessage] = useState("I'm sorry, I don't understand. Can you please rephrase?");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [draggingNode, setDraggingNode] = useState<Node | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [creatingConnection, setCreatingConnection] = useState<any | null>(null);
 

const [availableNodeTypes] = useState<NodeTypeDefinition[]>([ // Using the new interface
    { type: 'start', label: 'Start' },
    { type: 'message', label: 'Message' },
    { type: 'multichoice', label: 'Multi Choice' },
    { type: 'button', label: 'Button' },
    { type: 'textinput', label: 'Text Input' },
    { type: 'rating', label: 'Rating' },
]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
   const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  useEffect(() => {
    if (nodes.length === 0) {
      setNodes([
        {
          id: 'start-1',
          type: 'start',
          x: 100,
          y: 120,
          data: {
            title: 'Start',
            content: 'Start your chatbot flow here',
            useAI: false,
          },
          outputs: ['output-1'],
        },
      ]);
    }
  }, [nodes.length]);

  useEffect(() => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setCanvasOffset({ x: rect.left, y: rect.top });
    }
  }, [canvasRef]);

  useEffect(() => {
    if (isPreviewMode) {
      setIsInitialLoading(true);
      setConversation([{ sender: 'bot', message: '...', isTyping: true }]);
      
      const generatedRules: Rule[] = [];
      const startNode = nodes.find(node => node.type === 'start');
      let initialCurrentNodeId: string | null = null;

      // Simulate loading delay
      setTimeout(() => {
        let initialMessages: Message[] = [];

        if (startNode) {
          initialMessages.push({ sender: 'bot', message: startNode.data.content });
          initialCurrentNodeId = startNode.id;

          const firstStartConnection = connections.find(conn => conn.sourceId === startNode.id);
          if (firstStartConnection) {
            const nextNode = nodes.find(node => node.id === firstStartConnection.targetId);
            if (nextNode) {
              const messageData: Message = {
                sender: 'bot',
                message: nextNode.data.content,
                nodeId: nextNode.id
              };

              // Add options if the node is multichoice or button
              if ((nextNode.type === 'multichoice' || nextNode.type === 'button') && nextNode.data.options) {
                messageData.options = nextNode.data.options.map(opt => ({
                  label: opt.label,
                  value: opt.value
                }));
              }

              initialMessages.push(messageData);
              initialCurrentNodeId = nextNode.id; // Set current node to the first connected node
            }
          }
        } else {
          initialMessages.push({ sender: 'bot', message: welcomeMessage });
        }

        setConversation(initialMessages);
        setCurrentNodeId(initialCurrentNodeId);
        setIsInitialLoading(false);

        connections.forEach(conn => {
          const targetNode = nodes.find(node => node.id === conn.targetId);
          if (targetNode) {
            generatedRules.push({
              id: generateId('rule'),
              trigger: conn.sourceOutput, // Connection label is the trigger
              response: targetNode.data.content, // Target node content is the response
              isExactMatch: true, // Assuming exact match for flow triggers
              useAI: targetNode.data.useAI || false, // Use AI setting from target node
            });
          }
        });

        setRules(generatedRules); // Set the dynamically generated rules
      }, 1000); // 1 second loading delay
    } else {
      setConversation([]); // Clear conversation when exiting preview
      setCurrentNodeId(null);
      setIsInitialLoading(false);
    }
  }, [isPreviewMode, nodes, connections, welcomeMessage]);

  const generateId = (prefix: string) => {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };
const exportChatbot = () => {
  const chatbotConfig = {
    botName,
    welcomeMessage,
    fallbackMessage,
    nodes,       // These are the actual JavaScript objects/arrays from your state
    connections, // These are the actual JavaScript objects/arrays from your state
    mountId: 'my-chatbot-widget', // The ID of the div where the chatbot will be injected
  };

  const configJsonString = JSON.stringify(chatbotConfig, null, 2); // null, 2 for pretty-printing in the output

  const scriptUrl = 'https://your-domain.com/path/to/my-chatbot-widget.bundle.js'; // <<<--- !!! CHANGE THIS URL !!! --->>>

  // 4. Construct the complete HTML script tag
  const generatedScript = `
<div id="${chatbotConfig.mountId}"></div>
<script>
  // This global variable will hold all the configuration data for the chatbot widget.
  // It's parsed directly from the JSON string embedded by your builder.
  window.myChatbotConfig = ${configJsonString};

  // Create a new script element to load the chatbot widget bundle.
  const script = document.createElement('script');
  script.id = 'my-chatbot-script';
  script.src = '${scriptUrl}';
  script.defer = true; // 'defer' ensures the script executes after the HTML is parsed, but before DOMContentLoaded.

  // When the widget script finishes loading, initialize the chatbot.
  script.onload = () => {
    if (window.MyChatbotWidget && window.MyChatbotWidget.init) {
      // Call the init function exposed by your widget.bundle.js, passing the configuration.
      window.MyChatbotWidget.init(window.myChatbotConfig);
    } else {
      console.error('MyChatbotWidget or its init method not found after script load. Ensure the widget bundle is loaded correctly and window.MyChatbotWidget is exposed globally.');
    }
  };

  // Append the script element to the document body to start loading.
  document.body.appendChild(script);
</script>
`;

  // 5. Provide the generated script to the user
  console.log("Generated Chatbot Script:\n", generatedScript);
  alert('Chatbot script generated and copied to clipboard! Paste it into your website\'s HTML (preferably before the closing </body> tag).');

  // Copy to clipboard for easy pasting by the user
  navigator.clipboard.writeText(generatedScript)
    .then(() => {}) // Success, alert already handled
    .catch(err => {
      console.error('Failed to copy script to clipboard: ', err);
      alert('Failed to copy script to clipboard. Please copy it manually from the console.');
    });
};

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const clickedNode = nodes.find((node) => {
      return x >= node.x && x <= node.x + 200 && y >= node.y && y <= node.y + 80;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      setDraggingNode(clickedNode);
      setDragOffset({
        x: x - clickedNode.x,
        y: y - clickedNode.y,
      });
    } else {
      setSelectedNode(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!draggingNode) {
      if (creatingConnection) {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;

        setCreatingConnection({
          ...creatingConnection,
          endX: x,
          endY: y,
        });
      }
      return;
    }

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === draggingNode.id ? { ...node, x: x - dragOffset.x, y: y - dragOffset.y } : node
      )
    );
  };

  const handleCanvasMouseUp = () => {
    setDraggingNode(null);

    if (creatingConnection) {
      const targetNode = nodes.find((node) => {
        if (node.id === creatingConnection.sourceNodeId) return false;

        const inputX = node.x; // Input point is on the left edge of the node
        const inputY = node.y + 40; // Mid-height of the node
        const distance = Math.sqrt(
          Math.pow(inputX - creatingConnection.endX, 2) + Math.pow(inputY - creatingConnection.endY, 2)
        )
        return distance < 20; // Within 20px radius of the input point
      });

      if (targetNode) {
        let sourceOutputIdentifier = 'output-1';
        const sourceNode = nodes.find(n => n.id === creatingConnection.sourceNodeId);
        if (sourceNode && (sourceNode.type === 'multichoice' || sourceNode.type === 'button')) {
            sourceOutputIdentifier = prompt("Enter the text/value that triggers this connection (e.g., 'Yes', 'Option A'):") || 'output-1';
        }
        setConnections([
          ...connections,
          {
            id: generateId('conn'),
            sourceId: creatingConnection.sourceNodeId,
            sourceOutput: sourceOutputIdentifier, // This will be the trigger for the next node
            targetId: targetNode.id,
          },
        ]);
      }
      setCreatingConnection(null);
    }
  };

  const startConnection = (nodeId: string, outputId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const sourceNode = nodes.find((node) => node.id === nodeId);
    if (!sourceNode) return;

    const outputX = sourceNode.x + 200;
    const outputY = sourceNode.y + 40;

    setCreatingConnection({
      sourceNodeId: nodeId,
      sourceOutput: outputId,
      startX: outputX,
      startY: outputY,
      endX: outputX,
      endY: outputY,
    });
  };

  const addNewNode = (type: Node['type']) => {
    const nodeType = availableNodeTypes.find((nt) => nt.type === type);
    if (!nodeType) return;
    let title: string, content: string;
    let options: { label: string; value: string; nextNodeId?: string }[] | undefined;
    let useAI: boolean = false;

    switch (type) {
      case 'start':
        title = 'Start';
        content = 'Start your chatbot flow here';
        break;
      case 'message':
        title = 'Welcome Card';
        content = 'Welcome to huyu! How can I help you today?';
        break;
      case 'multichoice':
        title = 'Multi Choice Card';
        content = 'Hey there! Looking out for the best courses for your educational qualification? I can help!';
        options = [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' },
        ];
        break;
      case 'button':
        title = 'Button Card';
        content = 'Hey there! Looking out for the best and economic loan plans? I can help.';
        options = [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ];
        break;
      case 'textinput':
        title = 'Text Input Card';
        content = 'Please enter your name.';
        useAI = true; // Example: Text input might often lead to AI processing
        break;
      case 'rating':
        title = 'Rating Card';
        content = 'Please rate your experience (1-5).';
        break;
      default:
        title = 'New Card';
        content = 'Card content';
    }

    const newNode: Node = {
      id: generateId(type),
      type,
      x: 300,
      y: 200,
      data: {
        title,
        content,
        options,
        useAI,
      },
      outputs: type !== 'rating' ? ['output-1'] : [],
    };

    setNodes([...nodes, newNode]);
    setSelectedNode(newNode);
  };

  const updateNodeData = (nodeId: string, field: keyof NodeData, value: any) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, [field]: value } } : node
      )
    );

    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode({
        ...selectedNode,
        data: { ...selectedNode.data, [field]: value },
      });
    }
  };

  const addNodeOption = (nodeId: string) => {
    setNodes(prevNodes => prevNodes.map(node => {
      if (node.id === nodeId && (node.type === 'multichoice' || node.type === 'button')) {
        const newOption = { label: `New Option ${node.data.options ? node.data.options.length + 1 : 1}`, value: `option${Date.now()}` };
        return {
          ...node,
          data: {
            ...node.data,
            options: [...(node.data.options || []), newOption]
          }
        };
      }
      return node;
    }));
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(prevSelected => {
        if (prevSelected && (prevSelected.type === 'multichoice' || prevSelected.type === 'button')) {
          const newOption = { label: `New Option ${prevSelected.data.options ? prevSelected.data.options.length + 1 : 1}`, value: `option${Date.now()}` };
          return {
            ...prevSelected,
            data: {
              ...prevSelected.data,
              options: [...(prevSelected.data.options || []), newOption]
            }
          };
        }
        return prevSelected;
      });
    }
  };

  const updateNodeOption = (nodeId: string, optionIndex: number, field: 'label' | 'value', value: string) => {
    setNodes(prevNodes => prevNodes.map(node => {
      if (node.id === nodeId && (node.type === 'multichoice' || node.type === 'button') && node.data.options) {
        const updatedOptions = [...node.data.options];
        updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], [field]: value };
        return {
          ...node,
          data: {
            ...node.data,
            options: updatedOptions
          }
        };
      }
      return node;
    }));
    if (selectedNode && selectedNode.id === nodeId && (selectedNode.type === 'multichoice' || selectedNode.type === 'button') && selectedNode.data.options) {
      setSelectedNode(prevSelected => {
        if (prevSelected) {
          const updatedOptions = [...prevSelected.data.options!];
          updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], [field]: value };
          return {
            ...prevSelected,
            data: {
              ...prevSelected.data,
              options: updatedOptions
            }
          };
        }
        return prevSelected;
      });
    }
  };

  const deleteNodeOption = (nodeId: string, optionIndex: number) => {
    setNodes(prevNodes => prevNodes.map(node => {
      if (node.id === nodeId && (node.type === 'multichoice' || node.type === 'button') && node.data.options) {
        const updatedOptions = node.data.options.filter((_, index) => index !== optionIndex);
        return {
          ...node,
          data: {
            ...node.data,
            options: updatedOptions
          }
        };
      }
      return node;
    }));
    if (selectedNode && selectedNode.id === nodeId && (selectedNode.type === 'multichoice' || selectedNode.type === 'button') && selectedNode.data.options) {
      setSelectedNode(prevSelected => {
        if (prevSelected) {
          const updatedOptions = prevSelected.data.options!.filter((_, index) => index !== optionIndex);
          return {
            ...prevSelected,
            data: {
              ...prevSelected.data,
              options: updatedOptions
            }
          };
        }
        return prevSelected;
      });
    }
  };

  const deleteNode = (nodeId: string) => {
    if (nodeId === 'start-1') return; // Prevent deleting start node
    setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId));
    setConnections((prevConnections) =>
      prevConnections.filter((conn) => conn.sourceId !== nodeId && conn.targetId !== nodeId)
    );
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const deleteConnection = (connId: string) => {
    setConnections((prevConnections) => prevConnections.filter((conn) => conn.id !== connId));
  };

  const handleZoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.1, 0.5));
  };

 return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">No-Code Chatbot Builder</h1>
          <div className="header-buttons">
            {/* The export button remains */}
            <button onClick={exportChatbot} className="btn btn-export">
              Export Chatbot
            </button>
          </div>
        </div>
      </header>

      {isPreviewMode ? (
        <ChatbotPreview
          botName={botName}
          welcomeMessage={welcomeMessage}
          fallbackMessage={fallbackMessage}
          nodes={nodes}
          connections={connections}
        />
      ) : (
        <div className={`flow-builder-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          {isSidebarCollapsed && (
            <div className="sidebar-toggle-bar">
              <button
                id="sidebar-toggle-btn-show"
                className="btn btn-toggle"
                onClick={toggleSidebar}
                aria-label="Show Sidebar"
              >
                <span className="icon-hamburger"></span>
              </button>
            </div>
          )}

          {!isSidebarCollapsed && (
            <div className="sidebar">
              <div className="sidebar-section">
                <div className="sidebar-header-with-toggle">
                  <h3>Chatbot Settings</h3>
                  <button
                    id="sidebar-toggle-btn-hide"
                    className="btn btn-toggle btn-hide-sidebar"
                    onClick={toggleSidebar}
                    aria-label="Hide Sidebar"
                  >
                    <span className="icon-arrow-left"></span>
                  </button>
                </div>

                <div className="setting-item">
                  <label>Name</label>
                  <input
                    type="text"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    className="input-box"
                  />
                </div>
                <div className="setting-item">
                  <label>Welcome</label>
                  <input
                    type="text"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    className="input-box"
                  />
                </div>
                <div className="setting-item">
                  <label>Fallback</label>
                  <input
                    type="text"
                    value={fallbackMessage}
                    onChange={(e) => setFallbackMessage(e.target.value)}
                    className="input-box"
                  />
                </div>
              </div>

              <div className="sidebar-section">
                <h3>Node Types</h3>
                <div className="node-types">
                  {availableNodeTypes.map((nodeType) => (
                    <div
                      key={nodeType.type}
                       className={`node-type-item node-type-${nodeType.type.toLowerCase()}`}
            
                      onClick={() => addNewNode(nodeType.type)}
                    >
                      {nodeType.label}
                    </div>
                  ))}
                </div>
              </div>

              {selectedNode && (
                <div className="sidebar-section">
                  <h3>Node Properties</h3>
                  <div className="setting-item">
                    <label>Title</label>
                    <input
                      type="text"
                      value={selectedNode.data?.title || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, 'title', e.target.value)}
                      className="input-box"
                    />
                  </div>
                  <div className="setting-item">
                    <label>Content</label>
                    <textarea
                      value={selectedNode.data?.content || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, 'content', e.target.value)}
                      className="input-box"
                      rows={4}
                    />
                  </div>

                  {(selectedNode.type === 'multichoice' || selectedNode.type === 'button') && (
                    <div className="setting-item">
                      <label>Options</label>
                      {selectedNode.data.options?.map((option, index) => (
                        <div key={index} className="node-option-item">
                          <input
                            type="text"
                            placeholder="Label"
                            value={option.label}
                            onChange={(e) => updateNodeOption(selectedNode.id, index, 'label', e.target.value)}
                            className="input-box small-input"
                          />
                          <input
                            type="text"
                            placeholder="Value (trigger)"
                            value={option.value}
                            onChange={(e) => updateNodeOption(selectedNode.id, index, 'value', e.target.value)}
                            className="input-box small-input"
                          />
                          <button
                            onClick={() => deleteNodeOption(selectedNode.id, index)}
                            className="btn btn-delete-option"
                          >
                            X
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addNodeOption(selectedNode.id)} className="btn btn-add-option">
                        Add Option
                      </button>
                    </div>
                  )}

                  {(selectedNode.type === 'message' || selectedNode.type === 'textinput') && (
                    <div className="setting-item ai-toggle-section">
                      <input
                        type="checkbox"
                        id="aiToggle"
                        checked={selectedNode.data.useAI || false}
                        onChange={(e) => updateNodeData(selectedNode.id, 'useAI', e.target.checked)}
                      />
                      <label htmlFor="aiToggle">Use AI for response</label>
                    </div>
                  )}

                  {selectedNode.id !== 'start-1' && (
                    <button onClick={() => deleteNode(selectedNode.id)} className="btn btn-delete">
                      Delete Node
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flow-canvas-container">
            <div className="flow-canvas-tools">
              <button onClick={handleZoomIn} className="zoom-btn">
                +
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button onClick={handleZoomOut} className="zoom-btn">
                -
              </button>
            </div>
            <div
              className="flow-canvas"
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            >
              <div className="canvas-content" style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
                <svg className="connections-layer" width="100%" height="100%">
                  {connections.map((conn) => {
                    const sourceNode = nodes.find((n) => n.id === conn.sourceId);
                    const targetNode = nodes.find((n) => n.id === conn.targetId);

                    if (!sourceNode || !targetNode) return null;

                    const startX = sourceNode.x + 200;
                    const startY = sourceNode.y + 40;
                    const endX = targetNode.x;
                    const endY = targetNode.y + 40;

                    const controlX1 = startX + 50;
                    const controlX2 = endX - 50;

                    return (
                      <g key={conn.id}>
                        <path
                          d={`M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`}
                          fill="none"
                          stroke="#888"
                          strokeWidth="2"
                          onClick={() => deleteConnection(conn.id)}
                        />
                        <circle cx={endX} cy={endY} r="5" fill="#888" />
                        <text
                          x={(startX + endX) / 2}
                          y={(startY + endY) / 2 - 10}
                          fill="#555"
                          fontSize="10"
                          textAnchor="middle"
                          pointerEvents="none"
                        >
                          {conn.sourceOutput}
                        </text>
                      </g>
                    );
                  })}

                  {creatingConnection && (
                    <path
                      d={`M ${creatingConnection.startX} ${creatingConnection.startY}
                        C ${creatingConnection.startX + 50} ${creatingConnection.startY},
                          ${creatingConnection.endX - 50} ${creatingConnection.endY},
                          ${creatingConnection.endX} ${creatingConnection.endY}`}
                      fill="none"
                      stroke="#888"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  )}
                </svg>
                {nodes.map((node) => {
                  const nodeType = availableNodeTypes.find((nt) => nt.type === node.type);
                  return (
                    <div
                      key={node.id}
                      className={`flow-node ${selectedNode?.id === node.id ? 'selected' : ''}`}
                       style={{ left: node.x, top: node.y }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode(node);
                      }}
                    >
                      <div className="flow-node-header">
                        {node.data?.title || 'Unnamed Node'}
                        <div className="flow-node-input">
                          <div className="input-point" />
                        </div>
                      </div>
                      <div className="flow-node-content">
                        {node.data?.content || 'No content'}
                      </div>
                      {node.outputs && node.outputs.length > 0 && (
                        <div className="flow-node-outputs">
                          {node.outputs.map((output: string) => (
                            <div
                              key={output}
                              className="output-point"
                              onMouseDown={(e) => startConnection(node.id, output, e)}
                            />
                          ))}
                        </div>
                      )}
                      {(node.type === 'multichoice' || node.type === 'button') && node.data.options && (
                        <div className="node-options-display">
                          {node.data.options.map((option, index) => (
                            <div
                              key={index}
                              className="node-option-item-display">
                              {option.label}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flow-node-type">
                        {nodeType?.type.toUpperCase() || 'NODE'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      <ChatbotPreview
          botName={botName}
          welcomeMessage={welcomeMessage}
          fallbackMessage={fallbackMessage}
          nodes={nodes}
          connections={connections}
        />
    </div>
  );
};
    
  export default ChatbotBuilder;