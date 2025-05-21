import { useState, useEffect } from 'react';
import './ChatbotBuilder.css'


interface Rule {
  id: string;
  trigger: string;
  response: string;
  isExactMatch: boolean;
  useAI: boolean;
}


interface Message {
  sender: string;
  message: string;
  isTyping?: boolean;  // Added isTyping as optional property
}

// AI response function
const getAIResponse = async (userMessage: string): Promise<string> => {
  try {
    console.log("Sending request to Groq API...");
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer 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`, 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma2-9b-it",
        messages: [
          { role: "system", content: "You are a helpful chatbot assistant." },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      return `API Error (${response.status}): Please check your API key and settings.`;
    }

    const data = await response.json();
    console.log("API Response data:", data);

    if (!data.choices || data.choices.length === 0) {
      console.error("No choices in response:", data);
      return "Error: The AI service returned an empty response.";
    }
    let aiResponse = data.choices[0].message.content.trim();
    aiResponse = aiResponse.replace(/\*/g, '');
    aiResponse = aiResponse.replace(/^\* /gm, '• ');
    aiResponse = aiResponse.replace("* ", "• ")
    return aiResponse;
  } catch (error) {
    console.error("GROQ API error:", error);
    return `API Error: ${error.message || "Unknown error occurred"}`;
  }
};

const ChatbotBuilder = () => {

  const [rules, setRules] = useState<Rule[]>([]);
  
  const [botName, setBotName] = useState('My Chatbot');
  const [welcomeMessage, setWelcomeMessage] = useState('Hello! How can I help you today?');
  

  const [fallbackMessage, setFallbackMessage] = useState("I'm sorry, I don't understand. Can you please rephrase?");

  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  

  const [conversation, setConversation] = useState<Message[]>([]);
  

  const [userMessage, setUserMessage] = useState('');


  useEffect(() => {
    if (isPreviewMode) {
      setConversation([{ sender: 'bot', message: welcomeMessage }]);
    }
  }, [isPreviewMode, welcomeMessage]);
  
  // Add a new rule
  const addRule = () => {
    const newRule = {
      id: Date.now().toString(),
      trigger: '',
      response: '',
      isExactMatch: false,
      useAI: false,  // Default to false
    };
    setRules([...rules, newRule]);
    setEditingRule(newRule);
  };
  
  // Update a rule
  const updateRule = (id: string, field: keyof Rule, value: string | boolean) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    ));
    
    if (editingRule && editingRule.id === id) {
      setEditingRule({ ...editingRule, [field]: value });
    }
  };
  
  // Delete a rule
  const deleteRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
    if (editingRule && editingRule.id === id) {
      setEditingRule(null);
    }
  };


  // Move rule up in order - added type annotation
  const moveRuleUp = (index: number) => {
    if (index === 0) return;
    const newRules = [...rules];
    [newRules[index-1], newRules[index]] = [newRules[index], newRules[index-1]];
    setRules(newRules);
  };

  // Move rule down in order - added type annotation
  const moveRuleDown = (index: number) => {
    if (index === rules.length - 1) return;
    const newRules = [...rules];
    [newRules[index], newRules[index+1]] = [newRules[index+1], newRules[index]];
    setRules(newRules);
  };
  
  // Process user message in preview mode
  const processUserMessage = async (message: string) => {
  if (!message.trim()) return;
  
  // Add user message to conversation
  setConversation(prev => [...prev, { sender: 'user', message }]);
  
  // Clear input field
  setUserMessage('');
  
  // Variable to store the matched rule
  let matchedRule: Rule | null = null;
  const userMessageLower = message.toLowerCase();
  
  // Find matching rule
  for (const rule of rules) {
    const triggerLower = rule.trigger.toLowerCase();
    
    if ((rule.isExactMatch && userMessageLower === triggerLower) || 
        (!rule.isExactMatch && userMessageLower.includes(triggerLower) && triggerLower !== '')) {
      matchedRule = rule;
      break;
    }
  }
  
  if (matchedRule) {
    if (matchedRule.useAI) {
      // Show typing indicator
      setConversation(prev => [...prev, { sender: 'bot', message: '...', isTyping: true }]);
      
      try {
        console.log("Getting AI response for:", message);
        // Get AI response
        const aiResponse = await getAIResponse(message);
        console.log("AI responded with:", aiResponse);
        
        // Replace typing indicator with actual response
        setConversation(prev => {
          const updatedConv = [...prev];
          // Find and replace the typing indicator with the AI response
          const typingIndex = updatedConv.findIndex(msg => msg.isTyping);
          if (typingIndex !== -1) {
            updatedConv[typingIndex] = { sender: 'bot', message: aiResponse };
          } else {
            // If no typing indicator found, just append the response
            updatedConv.push({ sender: 'bot', message: aiResponse });
          }
          return updatedConv;
        });
      } catch (error) {
        console.error('AI response error:', error);
        // Use fallback message if AI fails
        setConversation(prev => {
          const updatedConv = [...prev];
          // Find and replace the typing indicator with the fallback message
          const typingIndex = updatedConv.findIndex(msg => msg.isTyping);
          if (typingIndex !== -1) {
            updatedConv[typingIndex] = { 
              sender: 'bot', 
              message: `${matchedRule?.response || fallbackMessage} (Error: ${error.message})` 
            };
          } else {
            // If no typing indicator found, just append the fallback
            updatedConv.push({ 
              sender: 'bot', 
              message: `${matchedRule?.response || fallbackMessage} (Error: ${error.message})` 
            });
          }
          return updatedConv;
        });
      }
    } else {
      // Use predefined response
      setConversation(prev => [...prev, { sender: 'bot', message: matchedRule.response }]);
    }
  } else {
    // No matching rule found, use fallback message
    setConversation(prev => [...prev, { sender: 'bot', message: fallbackMessage }]);
  }
};
  
  // Toggle preview mode
  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };
  
  // Export chatbot configuration
  const exportChatbot = () => {
    const chatbotConfig = {
      name: botName,
      welcomeMessage,
      fallbackMessage,
      rules,
    };

    const blob = new Blob([JSON.stringify(chatbotConfig, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${botName.replace(/\s+/g, "-").toLowerCase()}-config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">No-Code Chatbot Builder</h1>
          <div className="header-buttons">
            <button
              onClick={togglePreviewMode}
              className={`btn btn-toggle ${
                isPreviewMode ? "btn-toggle-active" : ""
              }`}
            >
              {isPreviewMode ? "Back to Editor" : "Preview Chatbot"}
            </button>
            <button onClick={exportChatbot} className="btn btn-export">
              Export Chatbot
            </button>
          </div>
        </div>
      </header>

      {isPreviewMode ? (
        <div className="preview-container">
          <div className="preview-header">
            <h2 className="preview-title">{botName} - Preview</h2>
          </div>

          <div className="chat-window">
            <div className="chat-messages" id="conversation-container">
              {conversation.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-message ${
                    msg.sender === "user" ? "chat-message-user" : "chat-message-bot"
                  }`}
                >
                  <span className="chat-bubble">{msg.message}</span>
                </div>
              ))}
            </div>

            <div className="chat-input-container">
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    processUserMessage(userMessage);
                  }
                }}
                placeholder="Type a message..."
                className="chat-input"
              />
              <button
                onClick={() => processUserMessage(userMessage)}
                className="chat-send-btn"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid-container">
          {/* Chatbot Settings */}
          <div className="card chatbot-settings">
            <h2>Chatbot Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label>Chatbot Name</label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  className="input-box"
                />
              </div>
              
              <div>
                <label>Welcome Message</label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="input-box"
                  rows={2}
                />
              </div>
              
              <div>
                <label>Fallback Message</label>
                <textarea
                  value={fallbackMessage}
                  onChange={(e) => setFallbackMessage(e.target.value)}
                  className="input-box"
                  rows={2}
                />
              </div>
            </div>
          </div>
          
          {/* Rules List */}
          <div className="card">
            <div className="rules-header">
              <h2>Rules</h2>
              <div>
                <button onClick={addRule} className="input-box">
                  Add Rule
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              {rules.map((rule, index) => (
                <div
                  key={rule.id}
                  className={`rule-item ${editingRule && editingRule.id === rule.id ? 'active' : ''}`}
                  onClick={() => setEditingRule(rule)}
                >
                  <div className="truncate">
                    <span>If: </span>
                    <span>{rule.trigger || '[No trigger]'}</span>
                    {rule.useAI && <span className="ai-badge">AI</span>}
                  </div>
                  <div className="rule-buttons">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveRuleUp(index);
                      }}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveRuleDown(index);
                      }}
                      disabled={index === rules.length - 1}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRule(rule.id);
                      }}
                      className="delete"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              
              {rules.length === 0 && (
                <div className="text-center">
                  No rules yet. Click "Add Rule" to create your first rule.
                </div>
              )}
            </div>
          </div>
          
          {/* Rule Editor */}
          <div className="card rule-editor">
            <h2>Rule Editor</h2>
            
            {editingRule ? (
              <div className="space-y-4">
                <div>
                  <label>When user says (trigger):</label>
                  <input
                    type="text"
                    value={editingRule.trigger}
                    onChange={(e) => updateRule(editingRule.id, 'trigger', e.target.value)}
                    placeholder="e.g., hello, how are you, etc."
                  />
                </div>
                
                <div className="checkbox-label">
                  <input
                    type="checkbox"
                    id="exactMatch"
                    checked={editingRule.isExactMatch}
                    onChange={(e) => updateRule(editingRule.id, 'isExactMatch', e.target.checked)}
                  />
                  <label htmlFor="exactMatch">Exact match only</label>
                </div>
                
                <div className="checkbox-label">
                  <input
                    type="checkbox"
                    id="useAI"
                    checked={editingRule.useAI}
                    onChange={(e) => updateRule(editingRule.id, 'useAI', e.target.checked)}
                  />
                  <label htmlFor="useAI">Use AI to generate responses</label>
                </div>
                
                {/* Only show response field when AI is not enabled */}
                {!editingRule.useAI && (
                  <div>
                    <label>Chatbot responds with:</label>
                    <textarea
                      value={editingRule.response}
                      onChange={(e) => updateRule(editingRule.id, 'response', e.target.value)}
                      rows={4}
                      placeholder="Enter the chatbot's response here..."
                    />
                  </div>
                )}
                
                {/* Show fallback message if AI is enabled */}
                {editingRule.useAI && (
                  <div className="ai-note">
                    <p>AI will generate responses dynamically based on user input.</p>
                    <div>
                      <label>Fallback response (if AI fails):</label>
                      <textarea
                        value={editingRule.response}
                        onChange={(e) => updateRule(editingRule.id, 'response', e.target.value)}
                        rows={2}
                        placeholder="Fallback response if AI fails..."
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center" style={{padding: '3rem 0'}}>
                Select a rule from the list or add a new rule to edit.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotBuilder;