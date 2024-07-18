import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./ChatBox.css";

const token = localStorage.getItem('token');
const socketURL = "ws://s2.gnip.vip:37895";
const socket = io(socketURL, {
  query: { token },
  transports: ['websocket'],
  timeout: 10000,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 3000,
});

export const CustomerService = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const onConnect = () => {
      console.log('Socket.IO Connected');
      setIsConnected(true);
    };

    const onDisconnect = (reason) => {
      console.log(`Socket.IO Disconnected: ${reason}`);
      setIsConnected(false);
    };

    const onChatMessage = (data) => {
      console.log('Received message data:', JSON.stringify(data, null, 2));
      
      let messageData;
      if (Array.isArray(data) && data.length > 0 && data[0].message) {
        messageData = data[0].message;
      } else if (typeof data === 'object' && data.message) {
        messageData = data.message;
      } else {
        console.error('Unexpected message format:', data);
        return;
      }

      setMessages(prev => [...prev, {
        text: messageData.message || 'No message content',
        timestamp: messageData.timestamp || new Date().toISOString(),
        isUser: false
      }]);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message', onChatMessage);
    socket.on('chat message', onChatMessage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message', onChatMessage);
      socket.off('chat message', onChatMessage);
    };
  }, []);

  const sendMessage = () => {
    if (inputMessage.trim() === "") return;
    
    const messageData = {
      msg: inputMessage
    };
    
    socket.emit('send_message', messageData, (acknowledgement) => {
      if (acknowledgement) {
        console.log('Message sent successfully');
        setMessages(prev => [...prev, {
          text: inputMessage,
          timestamp: new Date().toISOString(),
          isUser: true
        }]);
      } else {
        console.warn('Message not acknowledged');
      }
    });
  
    setInputMessage("");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="customer-service">
      <div className="connection-status">
        {isConnected ? <span className="connected">Connected</span> : <span className="disconnected">Disconnected</span>}
      </div>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.isUser ? 'user' : 'bot'}`}>
            <div className="message-timestamp">{formatDateTime(msg.timestamp)}</div>
            <div className="message-text">{msg.text}</div>
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
        />
        <button onClick={sendMessage} disabled={!isConnected}>Send</button>
      </div>
    </div>
  );
};

export default CustomerService;