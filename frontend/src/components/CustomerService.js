// CustomerService component
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './CustomerService.css';
import socketURL from '../socket';

const CustomerService = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const currentTokenRef = useRef(null);
  const textAreaRef = useRef(null);

  // Effect to initialize the socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    currentTokenRef.current = token;

    // const socketURL = "ws://3.26.67.188:5001";
    // const socketURL = "ws://0.0.0.0:5001";

    socketRef.current = io(socketURL, {
      query: { token },
      transports: ['websocket'],
      timeout: 10000,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 3000,
    });

    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = (reason) => {
      setIsConnected(false);
    };

    const onMessage = (data) => {
      if (data.message) {
        const newMessage = {
          id: data.message.message_id,
          text: data.message.message,
          timestamp: data.message.timestamp,
          isFromAdmin: data.message.user_id !== data.message.chat_id,
          userName: data.message.user_name,
          userId: data.message.user_id,
          chatId: data.message.chat_id,
        };
        setMessages((prev) => {
          const updatedMessages = [...prev, newMessage];
          setTimeout(scrollToBottom, 0); // Scroll after state update
          return updatedMessages;
        });
      }
    };

    const onUserChatHistory = (history) => {
      if (history && Array.isArray(history.messages)) {
        const formattedHistory = history.messages.map((msg) => ({
          id: msg.message_id,
          text: msg.message,
          timestamp: msg.timestamp,
          isFromAdmin: msg.user_id !== msg.chat_id,
          userName: msg.user_name,
          userId: msg.user_id,
          chatId: msg.chat_id,
        }));
        setMessages(formattedHistory);
        setTimeout(scrollToBottom, 0); // Scroll after state update
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

  // Function to send a message
  const sendMessage = () => {
    if (inputMessage.trim() === '' || !isConnected || !socketRef.current)
      return;

    const messageData = {
      msg: inputMessage,
    };

    socketRef.current.emit('send_message', messageData, (acknowledgement) => {
      if (acknowledgement) {
        scrollToBottom(); // Scroll after the message is sent
      } else {
      }
    });

    setInputMessage('');
  };

  // Function to scroll to the bottom of the messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  };

  // Effect to scroll to the bottom whenever messages change
  useEffect(scrollToBottom, [messages]);

  // Function to format the date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="customer-service">
      <div className="chat-messages" ref={messagesEndRef}>
        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`message ${msg.isFromAdmin ? 'sent' : 'received'}`}
          >
            <div className="message-content">
              <div className="message-timestamp">
                {formatDateTime(msg.timestamp)}
              </div>
              <div className="message-text">
                {msg.isFromAdmin
                  ? `Admin (${msg.userId}): ${msg.text}`
                  : `${msg.userName} (${msg.userId}): ${msg.text}`}
              </div>
            </div>
          </div>
        ))}
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
