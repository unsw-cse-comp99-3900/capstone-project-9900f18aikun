import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Badge } from '@arco-design/web-react';
import io from 'socket.io-client';
import './AdminNotification.css';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import socketURL from '../../socket';

// const socketURL = "ws://3.26.67.188:5001";
// const socketURL = "ws://0.0.0.0:5001";

function AdminNotification({
  contentState,
  setForceUpdate,
  refreshAppointment,
}) {
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchNotificationStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(api + `/admin/view`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      setNotificationCount(data.unviewed_count || 0);
    } catch (error) {}
  }, []);

  const connectSocket = useCallback(() => {
    if (socketRef.current) return;

    const token = localStorage.getItem('token');

    const newSocket = io(socketURL, {
      transports: ['websocket'],
      query: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      newSocket.emit('get_admin_notifications', { token });
    });

    newSocket.on('connect_error', (error) => {});

    newSocket.on('request_notification', (data) => {
      if (data && data.user_id && data.name) {
        setNotificationCount((prevCount) => {
          const newCount = prevCount + 1;

          return newCount;
        });
        const newNotification = {
          id: Date.now(),
          title: 'Notification',
          message: `${data.user_id} has new request`,
        };
        setNotifications((prevNotifications) => [
          ...prevNotifications,
          newNotification,
        ]);

        // Remove the notification after 4.5 second
        setTimeout(() => {
          setNotifications((prevNotifications) =>
            prevNotifications.filter(
              (notification) => notification.id !== newNotification.id
            )
          );
        }, 6500);
      }
    });

    newSocket.on('error', (error) => {});

    newSocket.on('disconnect', (reason) => {
      socketRef.current = null;
    });

    newSocket.onAny((eventName, ...args) => {});

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

  useEffect(() => {}, [notificationCount]);

  const handleNotificationClick = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(api + `/admin/view`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotificationCount(0);

        // Check if the current path is '/admin/appointment'
        if (location.pathname === '/admin/appointment') {
          setForceUpdate((prev) => !prev); // Force re-render of AdminAppointment
        } else {
          navigate('/admin/appointment');
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {}
  };

  const removeNotification = (id) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notification) => notification.id !== id)
    );
    navigate('/admin/appointment');
  };

  return (
    <>
      <Badge
        count={notificationCount}
        dotStyle={{
          right: '-3px',
          top: '0px',
        }}
      >
        <button
          className="admin-notification"
          onClick={handleNotificationClick}
        >
          <img src="/admin_img/ringbell.jpg" alt="Notifications" />
        </button>
      </Badge>
      <div className="notification-container">
        {notifications.map((notification) => (
          <div key={notification.id} className="notification-item">
            <div className="notification-icon">i</div>
            <div className="notification-content">
              <div className="notification-title">{notification.title}</div>
              <div className="notification-message">{notification.message}</div>
            </div>
            <button onClick={() => removeNotification(notification.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export default AdminNotification;
