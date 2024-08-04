import React, { useState, useEffect } from 'react';
import {
  Route,
  Routes,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
} from 'react-router-dom';
import dayjs from 'dayjs';
import Dashboard from './components/dashboard';
import LoginPage from './components/LoginPage';
import HeaderBar from './components/HeaderBar';
import SelectMap from './components/selectMap';
import History from './components/history';
import RoomInfo from './components/roompage';
import AdminPage from './components/Admin_page';
import QrCodeCheckIn from './components/QrCodeCheckIn';
//loading
import { Spin, Space } from '@arco-design/web-react';

import './App.css';
import './ChatBoxWrapper.css';
import api from './api';

const ProtectedRoute = ({
  children,
  adminOnly = false,
  userOnly = false,
  isAdmin,
  isLoggedIn,
}) => {
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  if (userOnly && isAdmin) {
    return <Navigate to="/admin" />;
  }
  return children;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [outlook, setOutlook] = useState(false);

  useEffect(() => {
    const autoLogin = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch(api + '/auth/auto-login', {
            method: 'GET',
            headers: {
              accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.message !== 'User verified') {
              handleAutoLoginFailure();
            } else {
              setIsLoggedIn(true);
              if (data.is_admin) {
                setIsAdmin(true);
              }
            }
          } else {
            handleAutoLoginFailure();
          }
        } catch (error) {
          handleAutoLoginFailure();
        }
      }
      setIsLoading(false);
    };

    autoLogin();
  }, [outlook]);

  const handleAutoLoginFailure = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  const handleLogin = (admin) => {
    setIsLoggedIn(true);
    setIsAdmin(admin);
    const qrCode = localStorage.getItem('qrCode');
    if (qrCode) {
      navigate('/qr-check-in');
    } else {
      if (admin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleHistory = () => {
    navigate('/history');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('token');
    localStorage.removeItem('qrCode');
    navigate('/login');
  };

  useEffect(() => {
    if (location.pathname === '/login' && !location.state) {
      localStorage.removeItem('token');
      localStorage.removeItem('qrCode');
      setIsLoggedIn(false);
    }
  }, [location]);

  const handleQrCodeScan = (qrCode) => {
    localStorage.setItem('qrCode', qrCode);
    if (!isLoggedIn) {
      navigate('/login', { state: { fromQr: true } });
    } else {
      navigate('/qr-check-in');
    }
  };

  const token = localStorage.getItem('token');

  if (isLoading) {
    return (
      <div className="loading-container">
        <Space size={40}>
          <Spin size={40} />
        </Space>
      </div>
    ); // Or any loading indicator you prefer
  }

  return (
    <div className="app">
      <Routes>
        <Route
          path="/login"
          element={
            !isLoggedIn ? (
              <LoginPage
                onLogin={(admin) => handleLogin(admin)}
                setOutlook={setOutlook}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/QR/:id"
          element={
            <QrCodeRedirect
              onQrCodeScan={handleQrCodeScan}
              isLoggedIn={isLoggedIn}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              isLoggedIn={isLoggedIn}
              userOnly={true}
              isAdmin={isAdmin}
            >
              <>
                <HeaderBar onLogout={handleLogout} onHistory={handleHistory} />
                <Dashboard
                  isLoggedIn={isLoggedIn}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/select-map"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <>
                <HeaderBar onLogout={handleLogout} onHistory={handleHistory} />
                <SelectMap />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute
              isLoggedIn={isLoggedIn}
              userOnly={true}
              isAdmin={isAdmin}
            >
              <>
                <HeaderBar onLogout={handleLogout} onHistory={handleHistory} />
                <History />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/room/*"
          element={
            <ProtectedRoute
              isLoggedIn={isLoggedIn}
              userOnly={false}
              isAdmin={isAdmin}
            >
              <>
                <HeaderBar onLogout={handleLogout} onHistory={handleHistory} />
                <RoomInfo
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  isAdmin={isAdmin}
                />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute
              adminOnly={true}
              isAdmin={isAdmin}
              isLoggedIn={isLoggedIn}
            >
              <AdminPage token={token} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qr-check-in"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <QrCodeCheckIn />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            isLoggedIn ? (
              isAdmin ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </div>
  );
}

const QrCodeRedirect = ({ onQrCodeScan, isLoggedIn }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  // const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  useEffect(() => {
    localStorage.setItem('qrCode', id);
    if (isLoggedIn) {
      navigate('/qr-check-in');
    } else {
      navigate('/login', { state: { fromQr: true } });
    }
  }, [id, isLoggedIn, navigate]);

  return null;
};

export default App;
