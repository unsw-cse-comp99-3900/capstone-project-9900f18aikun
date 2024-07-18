import React, { useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import "./AdminChatbox.css";

const AdminChatbox = ({ onClose, userID }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socketURL = "ws://s2.gnip.vip:37895";
    
    socketRef.current = io(socketURL, {
      query: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      console.log('Admin Socket Connected');
    });

    socketRef.current.on('chat message', (data) => {
      console.log('Admin received message:', data);
      setMessages(prev => [...prev, { text: data.msg, sender: "user", timestamp: new Date() }]);
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

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

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSendMessage = () => {
    if (message.trim() !== "" && socketRef.current) {
      const messageData = {
        msg: message,
        user_id: userID
      };

      socketRef.current.emit('chat message', messageData, (acknowledgement) => {
        if (acknowledgement) {
          console.log('Admin message acknowledged:', acknowledgement);
        } else {
          console.warn('Admin message not acknowledged');
        }
      });

      setMessages(prev => [...prev, { text: message, sender: "admin", timestamp: new Date() }]);
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="admin-chatbox">
      <div className="chatbox-container">
        <div className="message-box">
          <div className="bottom-base">
            <input
              type="text"
              className="message-input"
              placeholder="Type your message here..."
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
            />
            <img
              className="vector"
              alt="Send"
              src={process.env.PUBLIC_URL + "/admin_chatbox_img/vector.svg"}
              onClick={handleSendMessage}
            />
          </div>
          <div 
            className="overlap-group"
            style={{backgroundImage: `url(${process.env.PUBLIC_URL}/admin_chatbox_img/rectangle-7.png)`}}
          >
            <div className="frame">
              <div className="text-wrapper-2">Admin Chat</div>
            </div>
            <div 
              className="icon-minus"
              style={{backgroundImage: `url(${process.env.PUBLIC_URL}/admin_chatbox_img/ellipse-1.svg)`}}
              onClick={onClose}
            >
              <img className="rectangle" alt="Rectangle" src={process.env.PUBLIC_URL + "/admin_chatbox_img/rectangle-1.svg"} />
            </div>
            <img className="customer" alt="Customer" src={process.env.PUBLIC_URL + "/admin_chatbox_img/customer-1.png"} />
          </div>
          <div className="chat-content">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <div className="message-timestamp">{formatDateTime(msg.timestamp)}</div>
                <div className="message-text">{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

        </div>
        <div className="messages-list">
          {}
        </div>
      </div>
    </div>
  );
};

export default AdminChatbox;