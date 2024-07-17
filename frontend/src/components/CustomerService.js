import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./ChatBox.css";

export const CustomerService = ({ messages, setMessages, toggleMode }) => {
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');      
    const socketURL = "ws://s2.gnip.vip:37895"; // Change to wss:// for production
    
    console.log("Attempting to connect to:", socketURL);

    socketRef.current = io(socketURL, {
      query: { token },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket.IO Connected');
      setIsConnected(true);
      setConnectionError(null);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket.IO Disconnected:', reason);
      setIsConnected(false);
    });

    socketRef.current.on('chat message', (data) => {
      console.log('Received message:', data);
      setMessages(prev => [...prev, { text: data.msg, sender: "admin", timestamp: new Date() }]);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection Error:', error);
      setConnectionError(`Connection error: ${error.message}`);
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket.IO Error:', error);
      setConnectionError(`Socket error: ${error.message}`);
    });

    socketRef.current.on('reconnect_attempt', (attemptNumber) => {
      console.log('Attempting reconnection:', attemptNumber);
    });

    // Attempt a plain WebSocket connection for debugging
    const ws = new WebSocket(`${socketURL}?token=${token}`);
    ws.onopen = () => console.log('Plain WebSocket Connected');
    ws.onerror = (error) => {
      console.error('Plain WebSocket Error:', error);
      console.log('WebSocket readyState:', ws.readyState);
    };
    ws.onclose = (event) => {
      console.log('WebSocket Closed:', event.code, event.reason);
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [setMessages]);

  const sendMessage = () => {
    if (inputMessage.trim() === "" || !socketRef.current) return;

    const messageData = {
      msg: inputMessage
    };

    console.log('Sending message:', messageData);
    socketRef.current.emit('chat message', messageData, (acknowledgement) => {
      if (acknowledgement) {
        console.log('Message acknowledged:', acknowledgement);
      } else {
        console.warn('Message not acknowledged');
      }
    });

    setMessages(prev => [...prev, { text: inputMessage, sender: "user", timestamp: new Date() }]);
    setInputMessage("");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="customer-service">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <div className="message-timestamp">
              {formatDateTime(msg.timestamp)}
            </div>
            <div className="message-text">
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message here..."
          disabled={!isConnected}
        />
        {/* <button onClick={sendMessage} disabled={!isConnected}>Send</button> */}
      </div>
      <div className="connection-status">
        Status: {isConnected ? 'Connected' : 'Disconnected'}
        {connectionError && <div className="error-message">{connectionError}</div>}
      </div>
      <div className="debug-info">
        <p>Socket.IO ID: {socketRef.current ? socketRef.current.id : 'Not connected'}</p>
      </div>
      <button onClick={toggleMode} className="mode-switch-button">
        Switch to ExpressBook
      </button>
    </div>
  );
};

export default CustomerService;