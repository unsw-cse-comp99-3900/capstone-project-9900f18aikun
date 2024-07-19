import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./ChatBox.css";

const CustomerService = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const currentUserIdRef = useRef(null);
  const textAreaRef = useRef(null);

  useEffect(() => {
    const storedMessages = localStorage.getItem('customerServiceMessages');
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }

    const token = localStorage.getItem('token');
    const socketURL = "ws://s2.gnip.vip:37895";

    socketRef.current = io(socketURL, {
      query: { token },
      transports: ['websocket'],
      timeout: 10000,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 3000,
    });

    currentUserIdRef.current = localStorage.getItem('user_id');

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

      if (data.message) {
        const { message_id, user_name, user_id, message, timestamp, chat_id } = data.message;
        
        const isFromCurrentUser = user_id === chat_id;

        if (!isFromCurrentUser) {
          const newMessage = {
            id: message_id,
            text: message,
            timestamp: timestamp,
            isFromCurrentUser: false,
            userName: user_name,
            userId: user_id,
            chatId: chat_id
          };
          setMessages(prev => {
            const updatedMessages = [...prev, newMessage];
            localStorage.setItem('customerServiceMessages', JSON.stringify(updatedMessages));
            return updatedMessages;
          });
        }
      } else {
        console.error('Unexpected message format:', data);
      }
    };

    socketRef.current.on('connect', onConnect);
    socketRef.current.on('disconnect', onDisconnect);
    socketRef.current.on('message', onChatMessage);
    socketRef.current.on('chat message', onChatMessage);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect', onConnect);
        socketRef.current.off('disconnect', onDisconnect);
        socketRef.current.off('message', onChatMessage);
        socketRef.current.off('chat message', onChatMessage);
        socketRef.current.disconnect();
      }
    };
  }, []);

  const sendMessage = () => {
    if (inputMessage.trim() === "") return;

    if (inputMessage.toLowerCase() === "clear") {
      clearMessages();
      setInputMessage("");
      return;
    }

    if (!isConnected || !socketRef.current) return;

    const messageData = {
      msg: inputMessage,
      user_id: currentUserIdRef.current
    };

    console.log('Sending message:', JSON.stringify(messageData, null, 2));

    const newMessage = {
      id: Date.now(),
      text: inputMessage,
      timestamp: new Date().toISOString(),
      isFromCurrentUser: true,
      userName: 'You',
      userId: currentUserIdRef.current,
      chatId: currentUserIdRef.current
    };

    setMessages(prev => {
      const updatedMessages = [...prev, newMessage];
      localStorage.setItem('customerServiceMessages', JSON.stringify(updatedMessages));
      return updatedMessages;
    });

    socketRef.current.emit('send_message', messageData, (acknowledgement) => {
      if (acknowledgement) {
        console.log('Message acknowledged by server');
      } else {
        console.warn('Message not acknowledged by server');
      }
    });

    setInputMessage("");
  };

  const clearMessages = () => {
    setMessages([]);
    localStorage.removeItem('customerServiceMessages');
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
                {msg.isFromCurrentUser ? `You: ${msg.text}` : `${msg.userName}: ${msg.text}`}
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