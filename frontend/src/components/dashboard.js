// Dashboard.js
import React, { useState, useEffect} from "react";
import Filter from "./filter";
import Rebook from "./rebook";
import Table from "./Table";
import ChatBox from "./ChatBox";
import ErrorBox from "./errorBox";
import { Notification } from '@arco-design/web-react';

const Dashboard = ({ isLoggedIn, selectedDate, setSelectedDate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [change, setChange] = useState(false);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filters, setFilters] = useState({
    level: "",
    capacity: "",
    category: "meeting_room",
    sort: "default",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const token = localStorage.getItem("token");

  const checkTodayBooking = async () => {
    try {
      const response = await fetch(
        "/api/booking/is_book_today?date=" + selectedDate.format("YYYY-MM-DD"),
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: "Bearer " + token,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.is_booking_today) {
          const errorText = `There is already a booking for ${selectedDate.format(
            "YYYY-MM-DD"
          )}. \n Please Avoid Double Booking`;
          setErrorMessage(errorText);
        }
      } else {
        const errorText = await response.text();
        setErrorMessage("Failed to Fetch Booking Data\nPlease Refresh");
      }
    } catch (error) {
      setErrorMessage("Failed to Fetch Booking Data\nPlease Refresh");
    }
  };

  useEffect(() => {
    checkTodayBooking();
  }, [selectedDate]);

  const fetchBookingData = async () => {
    try {
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
      if (response.ok) {
        const text = await response.text();
        const bookingData = JSON.parse(text);
        const dataArray = Object.values(bookingData);
        setData(dataArray);
      } else {
        setErrorMessage("Failed to Fetch Booking Data\nPlease Refresh");
      }
    } catch (error) {
      setErrorMessage("Failed to Fetch Booking Data\nPlease Refresh");
    }
  };

  const handleFilter = async (filters) => {
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

  useEffect(() => {
    if (errorMessage) {
      Notification.info({
        title: 'Booking notification',
        content: errorMessage,
        duration: 0, // 0 means the notification will not auto close
        onClose: () => setErrorMessage("")
      });
    }
  }, [errorMessage]); 

  return (
    <>
      <div className="main-content">
        <div className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
          <img
            src="/On@2x.png"
            alt="Toggle Sidebar"
            className="toggle-icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          />
          {isSidebarOpen && (
            <Filter
              onFilter={handleFilter}
              setData={setData}
              selectedDate={selectedDate}
              setErrorMessage={setErrorMessage}
            />
          )}
          <div>
            {/* {errorMessage && (
              <ErrorBox
                message={errorMessage}
                onClose={() => setErrorMessage("")}
              />
            )} */}
          </div>
        </div>
        <div className="content">
          <Rebook
            change={change}
            setChange={setChange}
            setErrorMessage={setErrorMessage}
          />
          <Table
            data={filteredData}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            map={true}
            change={change}
            setChange={setChange}
            setErrorMessage={setErrorMessage}
          />
        </div>
      </div>
      <div className="chat-box-wrapper">
        <ChatBox change={change} setChange={setChange} />
      </div>
    </>
  );
};

export default Dashboard;
