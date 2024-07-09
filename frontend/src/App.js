import React, { useState, useEffect } from "react";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import Table from "./components/Table";
import Filter from "./components/filter";
import LoginPage from "./components/LoginPage";
import HeaderBar from "./components/HeaderBar";
// import ToMap from './components/toMap';
import SelectMap from "./components/selectMap";
import History from "./components/history"
import "./App.css";
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
  const token = localStorage.getItem("token");
  const fetchBookingData = async () => {
    try {
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
      setData(dataArray); // 存储原始数据
      setFilteredData(dataArray); // 存储筛选后的数据
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
        // (filters.type === '' || item.type === filters.type)
      );
    });
    setFilteredData(newFilteredData); // 更新筛选后的数据
    setFilters(filters); // 更新筛选条件
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
    navigate("/dashboard");
  };

  const handleHistory = () => {
    navigate("/history");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchBookingData();
    }
  }, [isLoggedIn, selectedDate]);

  return (
    <div className="app">
      <Routes>
        <Route
          path="/login"
          element={
            !isLoggedIn ? (
              <LoginPage onLogin={handleLogin} />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isLoggedIn ? (
              <>
                <HeaderBar onLogout={handleLogout} onHistory={handleHistory} />
                <div className="main-content">
                  <div
                    className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}
                  >
                  <img
                      src='/On@2x.png' // 替换按钮为图标
                      alt="Toggle Sidebar"
                      className="toggle-icon" // 添加图标样式类
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
                    {/* <div className="to-map-wrapper">
                      <ToMap />
                    </div> */}
                  </div>
                </div>
              </>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/select-map"
          element={
            isLoggedIn ? (
              <>
                <HeaderBar onLogout={handleLogout} onHistory={handleHistory} />
                <SelectMap />
              </>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/history"
          element={
            isLoggedIn ? (
              <>
                <HeaderBar onLogout={handleLogout} onHistory={handleHistory} />
                <History />
              </>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="*"
          element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />}
        />
      </Routes>
    </div>
  );
}

export default App;
