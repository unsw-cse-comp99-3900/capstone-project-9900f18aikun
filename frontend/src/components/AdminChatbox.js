import React, { useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import "./AdminChatbox.css";

const AdminChatbox = ({ onClose }) => {
  const [message, setMessage] = useState("");
  const [messageHistories, setMessageHistories] = useState({});
  const [activeUsers, setActiveUsers] = useState(new Map());
  const [selectedUser, setSelectedUser] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [adminId, setAdminId] = useState(null);
  const [newMessageUsers, setNewMessageUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const pendingMessages = useRef(new Set());

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
      socketRef.current.emit('get_admin_chat_history');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection Error:', error);
      setConnectionStatus("error");
    });
    
    socketRef.current.on('message', (data) => {
      console.log('Raw data received:', data);
      if (data.message) {
        const { message_id, user_name, user_id, message, timestamp, chat_id } = data.message;
        
        const isAdminMessage = user_id !== chat_id;
    
        if (isAdminMessage && !adminId) {
          setAdminId(user_id);
        }
    
        const newMessage = { 
          id: message_id,
          text: message, 
          sender: isAdminMessage ? "admin" : "user", 
          timestamp: new Date(timestamp),
          userId: user_id,
          chatId: chat_id
        };
    
        setMessageHistories(prev => {
          const updatedMessages = [...(prev[chat_id] || [])];
          if (!pendingMessages.current.has(message_id)) {
            updatedMessages.push(newMessage);
            updatedMessages.sort((a, b) => a.timestamp - b.timestamp);
          }
          return {
            ...prev,
            [chat_id]: updatedMessages
          };
        });
    
        setActiveUsers(prev => {
          const newMap = new Map(prev);
          const existingUser = newMap.get(chat_id);
          newMap.set(chat_id, { 
            ...existingUser,
            userName: existingUser ? existingUser.userName : user_name, 
            chatId: chat_id,
            lastMessageTime: timestamp
          });
          return newMap;
        });
    
        if (!isAdminMessage) {
          setSelectedUser(prevSelected => prevSelected || chat_id);
          setNewMessageUsers(prev => new Set(prev).add(chat_id));
        }
    
        pendingMessages.current.delete(message_id);
      } else {
        console.warn('Received data in unexpected format:', data);
      }
    });

    socketRef.current.on('admin_chat_history', (data) => {
      console.log('Received admin chat history:', data);
      const newMessageHistories = {};
      const newActiveUsers = new Map();

      if (data && data.chat && Array.isArray(data.chat)) {
        data.chat.forEach(chat => {
          const chatId = chat.chat_id;
          newActiveUsers.set(chatId, { 
            userName: chat.name || "Unknown",
            chatId: chatId,
            lastMessageTime: chat.last_message_time,
            isHandled: chat.is_handled,
            isViewed: chat.is_viewed
          });
          
          const messages = Array.isArray(chat.messages) ? chat.messages.map(msg => {
            const isAdminMessage = msg.user_id !== chatId;
            if (isAdminMessage && !adminId) {
              setAdminId(msg.user_id);
            }
            return {
              id: msg.message_id,
              text: msg.message,
              sender: isAdminMessage ? "admin" : "user",
              timestamp: new Date(msg.timestamp),
              userId: msg.user_id,
              chatId: chatId
            };
          }).sort((a, b) => a.timestamp - b.timestamp) : [];

          newMessageHistories[chatId] = messages;
        });
      } else {
        console.error('Unexpected data structure for admin_chat_history:', data);
      }

      setMessageHistories(newMessageHistories);
      setActiveUsers(newActiveUsers);
      setSelectedUser(prevSelected => prevSelected || (newActiveUsers.size > 0 ? newActiveUsers.keys().next().value : null));
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
    if (message.trim() === "" || !socketRef.current || !selectedUser || !adminId) return;

    const messageData = {
      msg: message,
      user_id: selectedUser
    };

    console.log('Admin sending message:', messageData);
    
    const tempId = Date.now().toString();
    const newMessage = { 
      id: tempId,
      text: message, 
      sender: "admin", 
      timestamp: new Date(), 
      userId: adminId,
      chatId: selectedUser
    };

    pendingMessages.current.add(tempId);

    setMessageHistories(prev => {
      const updatedMessages = [...(prev[selectedUser] || []), newMessage].sort((a, b) => a.timestamp - b.timestamp);
      return {
        ...prev,
        [selectedUser]: updatedMessages
      };
    });

    setActiveUsers(prev => {
      const newMap = new Map(prev);
      const currentUser = newMap.get(selectedUser);
      newMap.set(selectedUser, { 
        ...currentUser,
        lastMessageTime: newMessage.timestamp
      });
      return newMap;
    });

    socketRef.current.emit('reply_message', messageData, (acknowledgement) => {
      if (acknowledgement) {
        console.log('Admin message acknowledged:', acknowledgement);
        if (acknowledgement.message_id) {
          setMessageHistories(prev => ({
            ...prev,
            [selectedUser]: prev[selectedUser].map(msg => 
              msg.id === tempId ? { ...msg, id: acknowledgement.message_id } : msg
            )
          }));
          pendingMessages.current.delete(tempId);
          pendingMessages.current.add(acknowledgement.message_id);
        }
      } else {
        console.warn('Admin message not acknowledged');
        setMessageHistories(prev => ({
          ...prev,
          [selectedUser]: prev[selectedUser].filter(msg => msg.id !== tempId)
        }));
        pendingMessages.current.delete(tempId);
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
    setNewMessageUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
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
              messageHistories[selectedUser].map((msg) => (
                <div key={msg.id} className={`message ${msg.sender}`}>
                  <div className="message-timestamp">{formatDateTime(msg.timestamp)}</div>
                  <div className="message-text">
                    {msg.sender === "admin" 
                      ? `Admin (${msg.userId}): ${msg.text}` 
                      : `${activeUsers.get(msg.chatId).userName}: ${msg.text}`}
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
              disabled={!selectedUser || !adminId}
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
  {Array.from(activeUsers.entries()).map(([chatId, userInfo], index) => {
    const latestMessage = messageHistories[chatId] && messageHistories[chatId].length > 0
      ? messageHistories[chatId][messageHistories[chatId].length - 1]
      : null;
    const avatarColor = `hsl(${index * 137.5}, 70%, 65%)`;
    const initials = userInfo.userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    
    return (
      // In the return statement, update the user-item div:
<div 
  key={chatId} 
  className={`user-item ${selectedUser === chatId ? 'selected' : ''} ${newMessageUsers.has(chatId) ? 'new-message' : ''}`}
  onClick={() => handleUserSelect(chatId)}
>
  <div className="user-avatar" style={{backgroundColor: avatarColor}}>
    {initials}
  </div>
  <div className="user-item-info">
    <div className="user-item-header">
      <span className="user-item-name">
        {userInfo.userName}
        {newMessageUsers.has(chatId) && <span className="new-message-prompt">New</span>}
      </span>
      <span className="user-item-time">{formatDateTime(userInfo.lastMessageTime)}</span>
    </div>
    <div className="user-item-last-message">
      {latestMessage 
        ? (latestMessage.sender === 'admin'
            ? `Admin (${latestMessage.userId}): ${latestMessage.text}`
            : `${userInfo.userName}: ${latestMessage.text}`)
        : 'No messages yet'}
    </div>
  </div>
</div>
    );
  })}
</div>
      </div>
    </div>
  );
};

export default AdminChatbox;