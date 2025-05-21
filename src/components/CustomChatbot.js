
import  { useState, useEffect, useRef } from 'react';

const CustomChatbot = ({ config }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (config && config.welcomeMessage) {
      setConversation([{ sender: 'bot', message: config.welcomeMessage }]);
    }
  }, [config]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  const processUserMessage = (message) => {
    if (!message.trim()) return;
    
    
    setConversation([...conversation, { sender: 'user', message }]);
    
    
    let botResponse = config.fallbackMessage || "I don't understand.";
    
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
    

    setTimeout(() => {
      setConversation(prev => [...prev, { sender: 'bot', message: botResponse }]);
    }, 500);
    
    setUserMessage('');
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-4 right-4 z-10">
      {/* Chat bubble */}
      {!isOpen && (
        <button 
          onClick={toggleChat}
          className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}
      
      {/* Chat window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-lg w-80 sm:w-96 flex flex-col" style={{ height: '500px' }}>
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
            <h3 className="font-medium">{config.name || 'Chatbot'}</h3>
            <button onClick={toggleChat} className="text-white hover:text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            {conversation.map((msg, index) => (
              <div 
                key={index} 
                className={`mb-3 ${msg.sender === 'user' ? 'text-right' : ''}`}
              >
                <span 
                  className={`inline-block px-4 py-2 rounded-lg ${
                    msg.sender === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {msg.message}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          

          <div className="border-t p-3">
            <div className="flex">
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && processUserMessage(userMessage)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => processUserMessage(userMessage)}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomChatbot;