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

import "./App.css";
import "./ChatBoxWrapper.css";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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

  useEffect(() => {
    const autoLogin = async () => {
      const token = localStorage.getItem("token");
      console.log("Attempting auto-login with token:", token);
      if (token) {
        try {
          const response = await fetch("http://s2.gnip.vip:37895/auth/auto-login", {
            method: "GET",
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          console.log("Auto-login response status:", response.status);

          if (response.ok) {
            const data = await response.json();
            console.log("Auto-login response data:", data);
            if (data.message === "User verified") {
              console.log("Auto-login successful");
              setIsLoggedIn(true);
              localStorage.setItem("isLoggedIn", "true");
              localStorage.setItem("isAdmin", data.is_admin.toString());
            } else {
              console.log("Auto-login failed: User not verified");
              handleAutoLoginFailure();
            }
          } else {
            console.log("Auto-login failed: Response not OK");
            handleAutoLoginFailure();
          }
        } catch (error) {
          console.error("Auto-login error:", error);
          handleAutoLoginFailure();
        }
      } else {
        console.log("No token found for auto-login");
      }
    };

    autoLogin();
  }, []);

  const handleAutoLoginFailure = () => {
    console.log("Handling auto-login failure");
    setIsLoggedIn(false);
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("isAdmin");
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
      setFilteredData(dataArray);
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
    handleFilter(filters);
  }, [filters, data, change]);

  const handleLogin = (token, isAdmin) => {
    console.log("Handling login with token:", token, "isAdmin:", isAdmin);
    setIsLoggedIn(true);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("token", token);
    localStorage.setItem("isAdmin", isAdmin.toString());
    const qrCode = localStorage.getItem("qrCode");
    if (qrCode) {
      console.log("Navigating to QR check-in");
      navigate("/qr-check-in");
    } else {
      console.log("Navigating to", isAdmin ? "admin" : "dashboard");
      navigate(isAdmin ? "/admin" : "/dashboard");
    }
  };

  const handleHistory = () => {
    navigate("/history");
  };

  const handleLogout = () => {
    console.log("Handling logout");
    setIsLoggedIn(false);
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("qrCode");
    navigate("/login");
  };

  useEffect(() => {
    if (location.pathname === "/login" && !location.state) {
      console.log("Clearing login state");
      localStorage.removeItem("token");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("isAdmin");
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

  return (
    <div className="app">
      <Routes>
        <Route
          path="/login"
          element={
            !isLoggedIn ? (
              <LoginPage onLogin={(token, isAdmin) => handleLogin(token, isAdmin)} />
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
            <ProtectedRoute>
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
            <ProtectedRoute>
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
            <ProtectedRoute>
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
            <ProtectedRoute>
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
          path="/admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminPage token={token} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/room/admin/*"
          element={
            <ProtectedRoute>
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
            <ProtectedRoute>
              <QrCodeCheckIn />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />
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