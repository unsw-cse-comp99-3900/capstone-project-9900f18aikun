import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./Admin.css";

export const Admin = () => {
  const [messages, setMessages] = useState({});
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    socketRef.current = io("https://s2.gnip.vip:37895", {
      query: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      console.log('Admin Socket.IO Connected');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Admin Socket.IO Disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('chat message', (data) => {
      console.log('Admin received message:', data);
      setMessages(prev => ({
        ...prev,
        [data.user_id]: [...(prev[data.user_id] || []), { text: data.msg, sender: "user", timestamp: new Date() }]
      }));
      if (!activeUsers.includes(data.user_id)) {
        setActiveUsers(prev => [...prev, data.user_id]);
      }
    });

    socketRef.current.on('active users', (users) => {
      setActiveUsers(users);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection Error:', error);
    });

    socketRef.current.on('reconnect_attempt', (attemptNumber) => {
      console.log('Attempting reconnection:', attemptNumber);
    });

    const pingInterval = setInterval(() => {
      if (socketRef.current.connected) {
        socketRef.current.emit('ping');
      }
    }, 10000);

    socketRef.current.on('pong', () => {
      console.log('Received pong from server');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      clearInterval(pingInterval);
    };
  }, []);

  const sendMessage = () => {
    if (inputMessage.trim() === "" || !socketRef.current || !selectedUser) return;

    const messageData = {
      msg: inputMessage,
      user_id: selectedUser
    };

    console.log('Admin sending message:', messageData);
    socketRef.current.emit('admin message', messageData, (acknowledgement) => {
      console.log('Message acknowledged:', acknowledgement);
    });

    setMessages(prev => ({
      ...prev,
      [selectedUser]: [...(prev[selectedUser] || []), { text: inputMessage, sender: "admin", timestamp: new Date() }]
    }));
    setInputMessage("");
  };

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
    <div className="admin-chat">
      <h2>Admin Customer Service</h2>
      <div className="connection-status">
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      <div className="user-list">
        {activeUsers.map(userId => (
          <button 
            key={userId} 
            onClick={() => setSelectedUser(userId)}
            className={selectedUser === userId ? 'active' : ''}
          >
            User {userId}
          </button>
        ))}
      </div>
      <div className="chat-messages">
        {selectedUser && messages[selectedUser] && messages[selectedUser].map((msg, index) => (
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
          disabled={!selectedUser}
        />
        <button onClick={sendMessage} disabled={!selectedUser}>Send</button>
      </div>
    </div>
  );
};

export default Admin;