// src/App.js
import  { useState } from 'react';
import ChatbotBuilder from './components/ChatbotBuilder.tsx';
import CustomChatbot from './components/CustomChatbot.js';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
function App() {
  const [chatbotConfig, setChatbotConfig] = useState(null);
  const [showBuilder, setShowBuilder] = useState(true);
  return (
    <div className="App">
      {showBuilder ? (
        <>
          <div className="p-3 bg-dark text-white">
            <div className="container d-flex justify-content-between align-items-center">
              <h1 className="h4 fw-bold">Chatbot Builder Platform</h1>
            </div>
          </div>
          <ChatbotBuilder 
            onExport={(config) => {
              setChatbotConfig(config);
              setShowBuilder(false);
            }}
          />
        </>
      ) : (
        <>
          <div className="p-3 bg-dark text-white">
            <div className="container d-flex justify-content-between align-items-center">
              <h1 className="h4 fw-bold">Chatbot Demo Mode</h1>
              <button
                onClick={() => setShowBuilder(true)}
                className="btn btn-primary"
              >
                Back to Builder
              </button>
            </div>
          </div>
          <div className="container py-4">
            <div className="bg-white shadow-sm border rounded-3 p-4 mb-4">
              <h2 className="h5 fw-semibold mb-3">Chatbot Demo</h2>
              <p className="mb-2">
                You are now previewing the chatbot "<strong>{chatbotConfig.name}</strong>". Look for the chat bubble in the bottom right corner.
              </p>
              <p>
                Try sending some messages to see how your configured rules work.
              </p>
            </div>
          </div>
          <CustomChatbot config={chatbotConfig} />
        </>
      )}
    </div>
  );
}

export default App;