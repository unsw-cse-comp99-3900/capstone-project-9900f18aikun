import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./CustomerService.css";

const CustomerService = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const currentTokenRef = useRef(null);
  const textAreaRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    currentTokenRef.current = token;

    const socketURL = "ws://s2.gnip.vip:37895";

    socketRef.current = io(socketURL, {
      query: { token },
      transports: ['websocket'],
      timeout: 10000,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 3000,
    });

    const onConnect = () => {
      console.log('Socket.IO Connected');
      setIsConnected(true);
    };

    const onDisconnect = (reason) => {
      console.log(`Socket.IO Disconnected: ${reason}`);
      setIsConnected(false);
    };

    const onMessage = (data) => {
      console.log('Received message:', data);
      if (data.message) {
        const newMessage = {
          id: data.message.message_id,
          text: data.message.message,
          timestamp: data.message.timestamp,
          isFromCurrentUser: data.message.user_id === currentTokenRef.current,
          userName: data.message.user_name,
          userId: data.message.user_id,
          chatId: data.message.chat_id
        };
        setMessages(prev => [...prev, newMessage]);
      }
    };

    const onUserChatHistory = (history) => {
      console.log('Received chat history:', history);
      if (history && Array.isArray(history.messages)) {
        const formattedHistory = history.messages.map(msg => ({
          id: msg.message_id,
          text: msg.message,
          timestamp: msg.timestamp,
          isFromCurrentUser: msg.user_id === msg.chat_id,
          userName: msg.user_name,
          userId: msg.user_id,
          chatId: msg.chat_id
        }));
        setMessages(formattedHistory);
      }
    };

    socketRef.current.on('connect', onConnect);
    socketRef.current.on('disconnect', onDisconnect);
    socketRef.current.on('message', onMessage);
    socketRef.current.on('user_chat_history', onUserChatHistory);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect', onConnect);
        socketRef.current.off('disconnect', onDisconnect);
        socketRef.current.off('message', onMessage);
        socketRef.current.off('user_chat_history', onUserChatHistory);
        socketRef.current.disconnect();
      }
    };
  }, []);

  const sendMessage = () => {
    if (inputMessage.trim() === "" || !isConnected || !socketRef.current) return;

    const messageData = {
      msg: inputMessage,
    };

    console.log('Sending message:', messageData);

    socketRef.current.emit('send_message', messageData, (acknowledgement) => {
      if (acknowledgement) {
        console.log('Message acknowledged by server');
      } else {
        console.warn('Message not acknowledged by server');
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

  const adjustTextAreaHeight = () => {
    const textArea = textAreaRef.current;
    if (textArea) {
      textArea.style.height = 'auto';
      textArea.style.height = textArea.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    adjustTextAreaHeight();
  }, [inputMessage]);

  return (
    <div className="customer-service">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={msg.id || index} className={`message ${msg.isFromCurrentUser ? 'sent' : 'received'}`}>
            <div className="message-content">
              <div className="message-timestamp">{formatDateTime(msg.timestamp)}</div>
              <div className="message-text">
                {msg.isFromCurrentUser ? `${msg.text}` : `${msg.userName}: ${msg.text}`}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input">
        <textarea
          ref={textAreaRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type your message here..."
          rows="1"
        />
        <div className="send-button-container">
          <img
            className="vector send-button"
            alt="Send"
            src="/chat_box/vector.svg"
            onClick={sendMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerService;