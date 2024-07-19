import React, { useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import "./AdminChatbox.css";

const AdminChatbox = ({ onClose }) => {
  const [message, setMessage] = useState("");
  const [messageHistories, setMessageHistories] = useState(() => {
    const savedHistories = localStorage.getItem('chatHistories');
    return savedHistories ? JSON.parse(savedHistories) : {};
  });
  const [activeUsers, setActiveUsers] = useState(() => {
    const savedUsers = localStorage.getItem('activeUsers');
    return savedUsers ? new Map(JSON.parse(savedUsers)) : new Map();
  });
  const [selectedUser, setSelectedUser] = useState(() => {
    return localStorage.getItem('selectedUser') || null;
  });
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [adminId, setAdminId] = useState(() => {
    return localStorage.getItem('adminId') || null;
  });
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const connectSocket = () => {
    const token = localStorage.getItem('token');
    const socketURL = "ws://s2.gnip.vip:37895";
    
    console.log("Attempting to connect to:", socketURL);
    console.log("Token:", token);

    socketRef.current = io(socketURL, {
      query: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current.on('connect', () => {
      console.log('Admin Socket Connected');
      console.log('Socket id:', socketRef.current.id);
      setConnectionStatus("connected");
      
      socketRef.current.emit('test_connection', { message: 'Hello from admin' });
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection Error:', error);
      setConnectionStatus("error");
    });
    
    socketRef.current.on('message', (data) => {
      console.log('Raw data received:', data);
      if (data.message) {
        const { message_id, user_name, user_id, message, timestamp, chat_id } = data.message;
        
        // Set adminId if it's not set yet
        if (!adminId) {
          setAdminId(user_id);
          localStorage.setItem('adminId', user_id);
        }

        const isAdminMessage = chat_id !== user_id;

        if (!isAdminMessage) {
          setActiveUsers(prev => {
            const newMap = new Map(prev).set(user_id, { userName: user_name, chatId: chat_id });
            localStorage.setItem('activeUsers', JSON.stringify(Array.from(newMap.entries())));
            return newMap;
          });
          setSelectedUser(prevSelected => {
            const newSelected = prevSelected || user_id;
            localStorage.setItem('selectedUser', newSelected);
            return newSelected;
          });
        }

        const newMessage = { 
          id: message_id,
          text: message, 
          sender: isAdminMessage ? "admin" : "user", 
          timestamp: new Date(timestamp),
          userId: user_id,
          userName: user_name,
          chatId: chat_id
        };

        setMessageHistories(prev => {
          const updatedHistories = {
            ...prev,
            [user_id]: [...(prev[user_id] || []), newMessage]
          };
          localStorage.setItem('chatHistories', JSON.stringify(updatedHistories));
          return updatedHistories;
        });
      } else {
        console.warn('Received data in unexpected format:', data);
      }
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
      setConnectionStatus("error");
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      setConnectionStatus("disconnected");
      if (reason === 'io server disconnect') {
        socketRef.current.connect();
      }
    });

    socketRef.current.on('reconnect_attempt', (attemptNumber) => {
      console.log('Attempting reconnection:', attemptNumber);
      setConnectionStatus("reconnecting");
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      setConnectionStatus("connected");
    });

    socketRef.current.on('reconnect_failed', () => {
      console.log('Failed to reconnect');
      setConnectionStatus("failed");
    });

    socketRef.current.onAny((eventName, ...args) => {
      console.log(`Received event: ${eventName}`, args);
    });
  };

  useEffect(() => {
    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSendMessage = () => {
    if (message.trim() === "" || !socketRef.current || !selectedUser) return;

    const messageData = {
      msg: message,
      user_id: selectedUser
    };

    console.log('Admin sending message:', messageData);
    
    // Immediately add the message to the chat
    const newMessage = { 
      text: message, 
      sender: "admin", 
      timestamp: new Date(), 
      userId: adminId,
      userName: "Admin"
    };
    setMessageHistories(prev => {
      const updatedHistories = {
        ...prev,
        [selectedUser]: [...(prev[selectedUser] || []), newMessage]
      };
      localStorage.setItem('chatHistories', JSON.stringify(updatedHistories));
      return updatedHistories;
    });

    // Then send it to the server
    socketRef.current.emit('reply_message', messageData, (acknowledgement) => {
      if (acknowledgement) {
        console.log('Admin message acknowledged:', acknowledgement);
      } else {
        console.warn('Admin message not acknowledged');
      }
    });

    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUser(userId);
    localStorage.setItem('selectedUser', userId);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageHistories, selectedUser]);

  return (
    <div className="admin-chatbox">
      <div className="chatbox-container">
        <div className="message-box">
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
            {selectedUser && messageHistories[selectedUser] ? (
              messageHistories[selectedUser].map((msg, index) => (
                <div key={index} className={`message ${msg.sender}`}>
                  <div className="message-timestamp">{formatDateTime(msg.timestamp)}</div>
                  <div className="message-text">
                    {msg.sender === "user" 
                      ? `${msg.userName} (${msg.userId}): ${msg.text}` 
                      : `Admin (${adminId}): ${msg.text}`}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-messages">Select a user to view messages</div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="bottom-base">
            <input
              type="text"
              className="message-input"
              placeholder={`Type your message here... ${selectedUser ? `(to ${selectedUser})` : '(select a user)'}`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!selectedUser}
            />
            <img
              className="vector"
              alt="Send"
              src={process.env.PUBLIC_URL + "/admin_chatbox_img/vector.svg"}
              onClick={handleSendMessage}
            />
          </div>
        </div>
        <div className="messages-list">
          <div className="active-users">
            Active Users: {activeUsers.size}
          </div>
          {Array.from(activeUsers.entries()).map(([userId, userInfo]) => (
            <div 
              key={userId} 
              className={`user-item ${selectedUser === userId ? 'selected' : ''}`}
              onClick={() => handleUserSelect(userId)}
            >
              {userInfo.userName} ({userId})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminChatbox;