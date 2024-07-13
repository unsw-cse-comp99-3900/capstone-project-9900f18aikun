import React, { useState, useEffect, useRef } from "react";
import "./ChatBox.css";

const Component = ({ className }) => (
  <div className={className}>
    {/* Add the content of your Component here if needed */}
  </div>
);

export const ChatBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  const toggleChatBox = () => {
    setIsOpen(prevState => !prevState);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (inputMessage.trim() === "") return;

    const newMessage = { text: inputMessage, sender: "user", timestamp: new Date() };
    setMessages([...messages, newMessage]);
    setInputMessage("");

    try {
      const response = await fetch('http://s2.gnip.vip:37895/booking/express-book', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: inputMessage,
          room_type: "hot desk"
        }),
      });

      const data = await response.json();
      const botMessage = { 
        text: data.response || "I'm sorry, I couldn't process that request.", 
        sender: "bot", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = { 
        text: "Sorry, there was an error processing your request.", 
        sender: "bot", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMessage]);
    }
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
      {isOpen && (
        <div className="chat-box-container">
          <div className="chat-box">
            <div className="overlap-group">
              <img className="rectangle" alt="Rectangle" src="/chat_box/rectangle-6.svg" />
              <div className="chat-messages">
                {messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.sender}`}>
                    <div className="message-timestamp">
                      {formatDateTime(msg.timestamp)}
                    </div>
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
                <div className="send-button-container">
                  <img 
                    className="vector send-button" 
                    alt="Send" 
                    src="/chat_box/vector.svg" 
                    onClick={sendMessage}
                  />
                </div>
              </div>
              <Component className="component-1" />
              <img className="rectangle-3" alt="Rectangle" src="/chat_box/rectangle-7.png" />
              <div className="icon-minus" onClick={toggleChatBox}>
                <img src="/chat_box/ellipse-1.svg" alt="Ellipse" className="ellipse-image" />
                <img className="rectangle-4" alt="Rectangle" src="/chat_box/rectangle-1.svg" />
              </div>
              <div className="chat-header">
                <img className="bot-image" alt="Image" src="/chat_box/image-3.png" />
                <span className="express-book-text">𝙀𝙭𝙥𝙧𝙚𝙨𝙨𝘽𝙤𝙤𝙠</span>
              </div>
              <div className="icon-minus" onClick={toggleChatBox}>
                <img src="/chat_box/ellipse-1.svg" alt="Ellipse" className="ellipse-image" />
                <img className="rectangle-4" alt="Rectangle" src="/chat_box/rectangle-1.svg" />
              </div>
            </div>
          </div>
        </div>
      )}
      <button className="chat-toggle-button" onClick={toggleChatBox}>
        <img src="/chat_box/image-2.png" alt="Chat" className="chat-toggle-icon" />
      </button>
    </>
  );
};