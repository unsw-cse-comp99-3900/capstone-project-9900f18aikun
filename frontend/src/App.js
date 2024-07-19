import React, { useState, useEffect } from "react";
import {
  Route,
  Routes,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import dayjs from "dayjs";
import Table from "./components/Table";
import Filter from "./components/filter";
import LoginPage from "./components/LoginPage";
import HeaderBar from "./components/HeaderBar";
import SelectMap from "./components/selectMap";
import History from "./components/history";
import RoomInfo from "./components/roompage";
import Rebook from "./components/rebook";
import AdminPage from "./components/Admin_page";
import { ChatBox } from "./components/ChatBox";
import AdminRoomPage from "./components/admin_comp/adminRoompage";
import QrCodeCheckIn from "./components/QrCodeCheckIn";
//loading
import { Spin, Space } from '@arco-design/web-react';

import "./App.css";
import "./ChatBoxWrapper.css";

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
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filters, setFilters] = useState({
    level: "",
    capacity: "",
    category: "meeting_room",
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const navigate = useNavigate();
  const location = useLocation();
  const [change, setChange] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const autoLogin = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await fetch(
            "http://s2.gnip.vip:37895/auth/auto-login",
            {
              method: "GET",
              headers: {
                accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.message !== "User verified") {
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
  }, []);

  const handleAutoLoginFailure = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  const fetchBookingData = async () => {
    try {
      const token = localStorage.getItem("token");
      const formattedDate = selectedDate.format("YYYY-MM-DD");
      const response = await fetch(
        `/api/booking/meetingroom?date=${formattedDate}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: "Bearer " + token,
          },
        }
      );
      const text = await response.text();
      const bookingData = JSON.parse(text);
      const dataArray = Object.values(bookingData);
      setData(dataArray);
    } catch (error) {
      console.error("Error fetching booking data:", error);
    }
  };

  const handleFilter = (filters) => {
    const newFilteredData = data.filter((item) => {
      return (
        (filters.level === "" || item.level === filters.level) &&
        (filters.capacity === "" || item.capacity >= filters.capacity) &&
        (filters.category === "all" || item.type === filters.category)
      );
    });
    setFilteredData(newFilteredData);
    setFilters(filters);
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchBookingData();
    }
  }, [selectedDate, isLoggedIn, change]);

  useEffect(() => {
    if (isLoggedIn) {
      handleFilter(filters);
    }
  }, [data]);

  const handleLogin = (admin) => {
    setIsLoggedIn(true);
    setIsAdmin(admin);
    const qrCode = localStorage.getItem("qrCode");
    if (qrCode) {
      console.log("Navigating to QR check-in");
      navigate("/qr-check-in");
    } else {
      if (admin) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  };

  const handleHistory = () => {
    navigate("/history");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("token");
    localStorage.removeItem("qrCode");
    navigate("/login");
  };

  useEffect(() => {
    if (location.pathname === "/login" && !location.state) {
      localStorage.removeItem("token");
      localStorage.removeItem("qrCode");
      setIsLoggedIn(false);
    }
  }, [location]);

  const handleQrCodeScan = (qrCode) => {
    console.log("Handling QR code scan:", qrCode);
    localStorage.setItem("qrCode", qrCode);
    if (!isLoggedIn) {
      console.log("Not logged in, navigating to login page");
      navigate("/login", { state: { fromQr: true } });
    } else {
      console.log("Logged in, navigating to QR check-in");
      navigate("/qr-check-in");
    }
  };

  const token = localStorage.getItem("token");

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
              <LoginPage onLogin={(admin) => handleLogin(admin)} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/QR/:id"
          element={<QrCodeRedirect onQrCodeScan={handleQrCodeScan} />}
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
                <div className="main-content">
                  <div
                    className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}
                  >
                    <img
                      src="/On@2x.png"
                      alt="Toggle Sidebar"
                      className="toggle-icon"
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    />
                    {isSidebarOpen && <Filter onFilter={handleFilter} />}
                  </div>
                  <div className="content">
                    <Rebook date={selectedDate} />
                    <Table
                      data={filteredData}
                      selectedDate={selectedDate}
                      setSelectedDate={setSelectedDate}
                      map={true}
                      change={change}
                      setChange={setChange}
                    />
                  </div>
                </div>
                <div className="chat-box-wrapper">
                  <ChatBox change={change} setChange={setChange} />
                </div>
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
              userOnly={true}
              isAdmin={isAdmin}
            >
              <>
                <HeaderBar onLogout={handleLogout} onHistory={handleHistory} />
                <RoomInfo
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
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
          path="/room/admin/*"
          element={
            <ProtectedRoute
              isLoggedIn={isLoggedIn}
              adminOnly={true}
              isAdmin={isAdmin}
            >
              <>
                <HeaderBar onLogout={handleLogout} onHistory={handleHistory} />
                <AdminRoomPage
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                />
              </>
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

const QrCodeRedirect = ({ onQrCodeScan }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  useEffect(() => {
    console.log("QR Code Redirect: id =", id, "isLoggedIn =", isLoggedIn);
    localStorage.setItem("qrCode", id);
    if (isLoggedIn) {
      console.log("Navigating to QR check-in");
      navigate("/qr-check-in");
    } else {
      console.log("Navigating to login page");
      navigate("/login", { state: { fromQr: true } });
    }
  }, [id, isLoggedIn, navigate]);

  return null;
};

export default App;
