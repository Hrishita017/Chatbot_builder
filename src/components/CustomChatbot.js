import { useState, useEffect, useRef } from 'react';
const CustomChatbot = ({ config }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (config && config.welcomeMessage) {
      setConversation([{ sender: 'bot', message: config.welcomeMessage, timestamp: new Date() }]);
    }
  }, [config]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  const processUserMessage = (message) => {
    if (!message.trim()) return;
    
    // Add user message with timestamp
    const userMsg = { sender: 'user', message, timestamp: new Date() };
    setConversation(prev => [...prev, userMsg]);
    
    // Show typing indicator
    setIsTyping(true);
    
    let botResponse = config.fallbackMessage || "I'm sorry, I don't understand that. Could you please rephrase your question?";
    
    if (config.rules && Array.isArray(config.rules)) {
      for (const rule of config.rules) {
        const userMessageLower = message.toLowerCase();
        const triggerLower = rule.trigger.toLowerCase();
        
        if ((rule.isExactMatch && userMessageLower === triggerLower) || 
            (!rule.isExactMatch && userMessageLower.includes(triggerLower) && triggerLower !== '')) {
          botResponse = rule.response;
          break;
        }
      }
    }

    // Simulate bot typing delay
    setTimeout(() => {
      setIsTyping(false);
      const botMsg = { sender: 'bot', message: botResponse, timestamp: new Date() };
      setConversation(prev => [...prev, botMsg]);
    }, 800);
    
    setUserMessage('');
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat bubble button */}
      {!isOpen && (
        <button 
          onClick={toggleChat}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-110 animate-pulse"
          aria-label="Open chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}
      
      {/* Chat window */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 sm:w-96 flex flex-col overflow-hidden" style={{ height: '520px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{config.name || 'AI Assistant'}</h3>
                <p className="text-blue-100 text-sm">Online now</p>
              </div>
            </div>
            <button 
              onClick={toggleChat} 
              className="text-white hover:text-blue-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-10"
              aria-label="Close chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Messages container */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
            {conversation.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-sm ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
                  {msg.sender === 'bot' && (
                    <div className="flex items-center mb-1">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">AI Assistant</span>
                    </div>
                  )}
                  <div 
                    className={`px-4 py-3 rounded-2xl shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md' 
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    <p className={`text-xs mt-2 ${
                      msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-xs">
                  <div className="flex items-center mb-1">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">AI Assistant</span>
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md border border-gray-200 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input area */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    processUserMessage(userMessage);
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                disabled={isTyping}
              />
              <button
                onClick={() => processUserMessage(userMessage)}
                disabled={isTyping || !userMessage.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-fit"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send • Powered by AI
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomChatbot;