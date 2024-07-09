import React, { useState, useEffect } from "react";
import { Route, Routes, Navigate, useNavigate, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import Table from "./components/Table";
import Filter from "./components/filter";
import LoginPage from "./components/LoginPage";
import HeaderBar from "./components/HeaderBar";
import SelectMap from "./components/selectMap";
import History from "./components/history";
import "./App.css";

const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const location = useLocation();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
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

  const fetchBookingData = async () => {
    try {
      const token = localStorage.getItem("token");
      const formattedDate = selectedDate.format("YYYY-MM-DD");
      console.log(formattedDate);
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
      console.log("data is", dataArray);
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
  }, [selectedDate, isLoggedIn]);

  useEffect(() => {
    handleFilter(filters);
  }, [filters, data]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    const from = location.state?.from?.pathname || "/dashboard";
    navigate(from, { replace: true });
  };

  const handleHistory = () => {
    navigate("/history");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    navigate("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (token && loggedIn) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="app">
      <Routes>
        <Route
          path="/login"
          element={
            !isLoggedIn ? (
              <LoginPage onLogin={handleLogin} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
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
                      src='/On@2x.png'
                      alt="Toggle Sidebar"
                      className="toggle-icon"
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    />
                    {isSidebarOpen && <Filter onFilter={handleFilter} />}
                  </div>
                  <div className="content">
                    <Table
                      data={filteredData}
                      selectedDate={selectedDate}
                      setSelectedDate={setSelectedDate}
                    />
                  </div>
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
          path="*"
          element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </div>
  );
}

export default App;