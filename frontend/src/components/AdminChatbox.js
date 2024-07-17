import React, { useState, useRef, useEffect } from "react";
import "./AdminChatbox.css";

const AdminChatbox = ({ onClose }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

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
    if (message.trim() !== "") {
      const timestamp = formatDateTime(new Date());
      setMessages([...messages, { text: message, sender: "admin", timestamp }]);
      setMessage("");
      setTimeout(() => {
        const responseTimestamp = formatDateTime(new Date());
        setMessages(prevMessages => [...prevMessages, { text: "This is a sample response.", sender: "user", timestamp: responseTimestamp }]);
      }, 1000);
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
              <div className="text-wrapper-2">z456</div>
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
                <div className="message-timestamp">{msg.timestamp}</div>
                <div className="message-text">{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="messages-list">
          {/* You can add a list of messages or contacts here if needed */}
        </div>
      </div>
    </div>
  );
};

export default AdminChatbox;