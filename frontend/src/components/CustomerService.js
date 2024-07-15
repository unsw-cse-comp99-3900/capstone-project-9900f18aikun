import React, { useState, useEffect, useRef } from "react";
import "./ChatBox.css";

export const CustomerService = ({ messages, setMessages, toggleMode }) => {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = () => {
    if (inputMessage.trim() === "") return;

    const newMessage = { text: inputMessage, sender: "user", timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);

   
    setTimeout(() => {
      const botResponse = { 
        text: "Thank you for your message. A customer service representative will respond to you shortly.", 
        sender: "bot", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);

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
    <>
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
      <button onClick={toggleMode} className="mode-switch-button">
        Switch to ExpressBook
      </button>
    </>
  );
};

export default CustomerService;