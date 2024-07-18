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
  const [connectionError, setConnectionError] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const onConnect = () => {
      console.log('Socket.IO Connected');
      console.log('Socket id:', socket.id);
      console.log('Socket namespace:', socket.nsp);
      setIsConnected(true);
      setConnectionError(null);
      setIsReconnecting(false);
    };

    const onDisconnect = (reason) => {
      console.log(`Socket.IO Disconnected: ${reason}`);
      setIsConnected(false);
      setIsReconnecting(true);
    };

    const onChatMessage = (data) => {
      console.log('Received message:', data);
      setMessages(prev => [...prev, { text: data.msg, sender: "admin", timestamp: new Date() }]);
    };

    const onConnectError = (error) => {
      console.error(`Connection Error: ${error.message}`);
      setConnectionError(`Connection error: ${error.message}`);
      setIsReconnecting(true);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat message', onChatMessage);
    socket.on('connect_error', onConnectError);

    if (socket.connected) {
      onConnect();
    }

    const pingInterval = setInterval(() => {
      if (socket.connected) {
        console.log('Sending ping');
        socket.emit('ping', null, () => {
          console.log('Received pong');
        });
      }
    }, 30000);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat message', onChatMessage);
      socket.off('connect_error', onConnectError);
      clearInterval(pingInterval);
    };
  }, []);

  const ensureConnection = () => {
    if (!socket.connected) {
      console.log('Socket not connected. Attempting to reconnect...');
      socket.connect();
      return new Promise((resolve) => {
        socket.once('connect', () => {
          console.log('Reconnected successfully');
          resolve();
        });
      });
    }
    return Promise.resolve();
  };

  const sendMessage = async () => {
    if (inputMessage.trim() === "") return;

    await ensureConnection();

    const messageData = {
      msg: inputMessage
    };

    console.log('Sending message:', messageData);
    console.log('Socket connected:', socket.connected);
    
    const newMessage = { text: inputMessage, sender: "user", timestamp: new Date(), pending: true };
    setMessages(prev => [...prev, newMessage]);
    
    let acknowledged = false;
    
    socket.emit('chat message', messageData, (acknowledgement) => {
      acknowledged = true;
      console.log('Message acknowledgement received:', acknowledgement);
      if (acknowledgement) {
        console.log('Message acknowledged:', acknowledgement);
        setMessages(prev => prev.map(msg => 
          msg === newMessage ? { ...msg, pending: false } : msg
        ));
      } else {
        console.warn('Message not acknowledged');
        setMessages(prev => prev.map(msg => 
          msg === newMessage ? { ...msg, error: true, pending: false } : msg
        ));
        setConnectionError("Message failed to send. Please try again.");
      }
    });

    setInputMessage("");

    setTimeout(() => {
      if (!acknowledged) {
        console.warn('Message acknowledgement timed out');
        setMessages(prev => prev.map(msg => 
          msg === newMessage ? { ...msg, error: true, pending: false } : msg
        ));
        setConnectionError("Message failed to send. Please try again.");
      }
    }, 5000);
  };

  const retryMessage = async (messageToRetry) => {
    await ensureConnection();

    const messageData = {
      msg: messageToRetry.text
    };

    console.log('Retrying message:', messageData);
    
    setMessages(prev => prev.map(msg => 
      msg === messageToRetry ? { ...msg, pending: true, error: false } : msg
    ));

    let acknowledged = false;

    socket.emit('chat message', messageData, (acknowledgement) => {
      acknowledged = true;
      if (acknowledgement) {
        console.log('Message acknowledged:', acknowledgement);
        setMessages(prev => prev.map(msg => 
          msg === messageToRetry ? { ...msg, pending: false, error: false } : msg
        ));
      } else {
        console.warn('Message not acknowledged');
        setMessages(prev => prev.map(msg => 
          msg === messageToRetry ? { ...msg, error: true, pending: false } : msg
        ));
        setConnectionError("Message failed to send. Please try again.");
      }
    });

    setTimeout(() => {
      if (!acknowledged) {
        console.warn('Message acknowledgement timed out');
        setMessages(prev => prev.map(msg => 
          msg === messageToRetry ? { ...msg, error: true, pending: false } : msg
        ));
        setConnectionError("Message failed to send. Please try again.");
      }
    }, 5000);
  };

  const checkConnection = () => {
    console.log('Checking connection status');
    console.log('Socket connected:', socket.connected);
    console.log('Socket id:', socket.id);
    console.log('Socket namespace:', socket.nsp);
  };

  const attemptReconnection = () => {
    console.log('Attempting manual reconnection');
    socket.disconnect();
    socket.connect();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

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
    <div className="customer-service">
      <div className="connection-status">
        {isConnected ? 
          <span className="connected">Connected</span> : 
          isReconnecting ?
          <span className="reconnecting">Reconnecting...</span> :
          <span className="disconnected">Disconnected</span>
        }
      </div>
      <button onClick={checkConnection}>Check Connection</button>
      <button onClick={attemptReconnection}>Reconnect</button>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender} ${msg.pending ? 'pending' : ''} ${msg.error ? 'error' : ''}`}>
            <div className="message-timestamp">
              {formatDateTime(msg.timestamp)}
            </div>
            <div className="message-text">
              <p>{msg.text}</p>
            </div>
            {msg.pending && <span className="pending-indicator">Sending...</span>}
            {msg.error && <span className="error-indicator" onClick={() => retryMessage(msg)}>Failed to send. Tap to retry.</span>}
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
        {/* <button 
          onClick={sendMessage}
          disabled={!isConnected}
        >
          Send
        </button> */}
      </div>
      {connectionError && <div className="error-message">{connectionError}</div>}
    </div>
  );
};

export default CustomerService;