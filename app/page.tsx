'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [websearchEnabled, setWebsearchEnabled] = useState(true);
  const [rating, setRating] = useState(0);
  const [chatHistory, setChatHistory] = useState('');
  const [dragboxText, setDragboxText] = useState('DRAG or DROP');
  
  const chatboxRef = useRef<HTMLDivElement>(null);
  const dragboxRef = useRef<HTMLDivElement>(null);

  // Theme toggle
  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragboxRef.current) {
      dragboxRef.current.style.border = isDark ? "2px dashed #88aacc" : "2px dashed #66cc88";
      dragboxRef.current.style.backgroundColor = isDark ? "#333944" : "#f0fff0";
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragboxRef.current) {
      dragboxRef.current.style.border = "2px dashed #ccc";
      dragboxRef.current.style.backgroundColor = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragboxRef.current) {
      dragboxRef.current.style.border = "2px dashed #ccc";
      dragboxRef.current.style.backgroundColor = "";
    }
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === "application/pdf") {
      setDroppedFile(files[0]);
      setDragboxText(`Selected: ${files[0].name}`);
    }
  };

  // PDF upload
  const uploadPDF = async () => {
    if (uploadInProgress) {
      setDragboxText("⏳ Upload already in progress...");
      return;
    }

    if (!droppedFile) {
      setDragboxText("⚠️ Please select a PDF first.");
      return;
    }

    setUploadInProgress(true);
    const formData = new FormData();
    formData.append("file", droppedFile);
    setDragboxText("📤 Uploading PDF...");

    try {
      const res = await fetch("http://localhost:7860/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setDragboxText("✅ PDF uploaded: " + data.result);
    } catch (err) {
      setDragboxText("❌ Upload failed: " + (err as Error).message);
    } finally {
      setUploadInProgress(false);
    }
  };

  // Chat functionality
  const ask = async () => {
    if (uploadInProgress) {
      alert("📄 PDF is still being processed. Please wait.");
      return;
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      text: trimmedQuery,
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');

    // Add thinking placeholder
    const thinkingMessage: Message = {
      id: Date.now() + 1,
      text: '⏳ Thinking...',
      isUser: false
    };

    setMessages(prev => [...prev, thinkingMessage]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmedQuery })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const botResponse = data.result;

      // Update the thinking message with actual response
      setMessages(prev => 
        prev.map(msg => 
          msg.id === thinkingMessage.id 
            ? { ...msg, text: botResponse }
            : msg
        )
      );

      // Update chat history
      setChatHistory(prev => prev + `You: ${trimmedQuery}\nJoeyLLM: ${botResponse}\n\n`);

    } catch (err) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === thinkingMessage.id 
            ? { ...msg, text: '❌ Error: ' + (err as Error).message }
            : msg
        )
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      ask();
    }
  };

  return (
    <div className={`${styles.body} ${isDark ? styles.dark : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <span className={styles.headerTitle}><b>Modelworks</b></span>
          <img src="https://i.imgur.com/tHtVPF4.png" alt="Modelworks logo" className={styles.logo} />
          <span className={styles.headerSubtitle}>Chat with an LLM</span>
        </div>
        <div className={styles.headerRight}>
          <button 
            id="theme-toggle" 
            className={styles.themeToggle}
            onClick={toggleTheme}
          >
            {isDark ? '🌔' : '🌒'}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className={styles.container}>
        {/* Left Column - Chat History */}
        <div className={styles.column}>
          <h3><b>Chat History</b></h3>
          <pre className={styles.history}>{chatHistory}</pre>
        </div>

        {/* Center Column - Chat */}
        <div className={styles.column}>
          <h3><b>MODEL:</b> JoeyLLM (Southern Cross AI)</h3>
          <div className={styles.chatbox} ref={chatboxRef}>
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`${styles.message} ${message.isUser ? styles.user : styles.bot}`}
              >
                {message.text}
              </div>
            ))}
          </div>
          <div className={styles.inputGroup}>
            <input
              id="query"
              className={styles.queryInput}
              placeholder="Your question..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button type="button" onClick={ask} className={styles.sendButton}>
              Send
            </button>
          </div>
        </div>

        {/* Right Column - Upload & Settings */}
        <div className={styles.column}>
          <h3><b>Upload a PDF</b></h3>
          <div 
            className={styles.dragbox}
            ref={dragboxRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {dragboxText}
          </div>
          <div className={styles.display}>
            <button 
              id="rag" 
              type="button" 
              onClick={uploadPDF}
              className={styles.submitButton}
            >
              Submit
            </button>
          </div>
          
          <br /><br />
          <h3><b>Websearch Mode</b></h3>
          <div className={styles.display}>
            <label>
              <input 
                type="checkbox" 
                checked={websearchEnabled}
                onChange={(e) => setWebsearchEnabled(e.target.checked)}
              />
              {' '}ON
            </label>
          </div>
          
          <br /><br />
          <h3><b>Rate Your Experience</b></h3>
          <div className={styles.display}>
            <input 
              type="range" 
              min="0" 
              max="5" 
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className={styles.footer}>Modelworks © 2025</p>
    </div>
  );
}