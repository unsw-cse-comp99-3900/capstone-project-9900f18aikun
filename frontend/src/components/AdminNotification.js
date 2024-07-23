import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Badge } from '@arco-design/web-react';
import io from 'socket.io-client';

const socketURL = "ws://s2.gnip.vip:37895";

function AdminNotification() {
  const [notificationCount, setNotificationCount] = useState(0);
  const socketRef = useRef(null);

  const fetchNotificationStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching notification status...');
      const response = await fetch(`/api/admin/view`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Notification data:', data);
      setNotificationCount(data.unviewed_count || 0);
    } catch (error) {
      console.error('Error fetching notification status:', error);
    }
  }, []);

  const connectSocket = useCallback(() => {
    if (socketRef.current) return;

    const token = localStorage.getItem('token');
    console.log('Attempting to connect to WebSocket...');
    const newSocket = io(socketURL, {
      transports: ['websocket'],
      query: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket.');
      newSocket.emit('get_admin_notifications', { token });
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    newSocket.on('request_notification', (data) => {
      console.log('Received request_notification:', data);
      if (data && data.user_id && data.name) {
        setNotificationCount(prevCount => prevCount + 1);
        console.log('Increased notification count');
      }
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket:', reason);
      socketRef.current = null;
    });

    newSocket.onAny((eventName, ...args) => {
      console.log(`Received event: ${eventName}`, args);
    });

    socketRef.current = newSocket;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const cleanup = connectSocket();
    fetchNotificationStatus();

    return cleanup;
  }, [connectSocket, fetchNotificationStatus]);

  useEffect(() => {
    console.log('Notification count changed:', notificationCount);
  }, [notificationCount]);

  const handleNotificationClick = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Marking notifications as viewed...');
      const response = await fetch(`/api/admin/view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Response status:', response.status);
      if (response.ok) {
        setNotificationCount(0);
        console.log('Notifications marked as viewed, reset notification count to 0');
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error marking notifications as viewed:', error);
    }
  };

  console.log('Rendering with notificationCount:', notificationCount);

  return (
    <Badge 
      count={notificationCount}
      dotStyle={{ 
        right: '-3px', 
        top: '0px',
      }}
    >
      <button className='admin-notification' onClick={handleNotificationClick}>
        <img src="/admin_img/ringbell.jpg" alt="Notifications" />
      </button>
    </Badge>
  );
}

export default AdminNotification;