import React, { useEffect, useState } from "react";
import "./history.css";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs from "dayjs";
import { Table as ArcoTable } from "@arco-design/web-react";

const Rebook = ({ change, setChange, setErrorMessage }) => {
  const [history, setHistory] = useState([]);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch("/api/history/booking-history", {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: "Bearer " + token,
          },
        });

        if (response.ok) {
          const result = await response.json();
          setHistory([result[0]]); // Update here to set the first result item inside an array
        } else {
          const errorText = await response.text();
          setErrorMessage("Failed to Fetch User History\nPlease Refresh");
          throw new Error("Server responded with an error: " + errorText);
        }
      } catch (error) {
        setErrorMessage("Failed to Fetch User History\nPlease Refresh");
      }
    };

    fetchHistory();
  }, []);

  const toggleCalendarVisibility = (e) => {
    setIsCalendarVisible(!isCalendarVisible);
    setCalendarPosition({ x: e.clientX, y: e.clientY });
  };

  function formatTime(time) {
    let [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  }

  const handleDateChange = async (date) => {
    // send request to backend
    const obj = {
      room_id: history[0].room_id,
      date: date.format("YYYY-MM-DD"),
      start_time: formatTime(history[0].start_time),
      end_time: formatTime(history[0].end_time),
    };
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("/api/booking/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(obj),
      });

      if (response.ok) {
        const result = await response.json();
        setChange(!change);
      } else {
        const errorText = await response.text();
        setErrorMessage("Failed to Rebook\nPlease Refresh");
        throw new Error("Something went wrong");
      }
    } catch (error) {
      setErrorMessage("Failed to Rebook\nPlease Refresh");
    }
    setIsCalendarVisible(!isCalendarVisible);
  };

  const disableDates = (date) => {
    const today = dayjs();
    const sevenDaysFromNow = today.add(7, "day");
    return date.isBefore(today, "day") || date.isAfter(sevenDaysFromNow, "day");
  };

  const columns = [
    {
      title: "Time",
      dataIndex: "time",
      key: "time",
      align: "center",
      render: (_, record) => `${record.start_time} - ${record.end_time}`,
    },
    {
      title: "Room Name",
      dataIndex: "room_name",
      key: "room_name",
      align: "center",
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, record) => (
        <span
          id={record.booking_id}
          onClick={(e) => toggleCalendarVisibility(e)}
          style={{ cursor: "pointer", color: "red" }}
        >
          {isCalendarVisible ? "Hide Calendar" : "Rebook"}
        </span>
      ),
    },
  ];

  return (
    <div className="reservation-history">
      <header>
        <h1>Last Booking:</h1>
      </header>

      {history[0] ? (
        <div>
          <ArcoTable
            columns={columns}
            data={history}
            rowKey="booking_id"
            pagination={false}
          />
        </div>
      ) : (
        <div className="no-history">No previous reservation history</div>
      )}
      {isCalendarVisible && (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateCalendar
            shouldDisableDate={disableDates}
            className="date-calendar-overlay"
            onChange={(date) => handleDateChange(date)}
            style={{
              position: "absolute",
              left: `${calendarPosition.x}px`,
              top: `${calendarPosition.y}px`,
              zIndex: 100,
            }}
          />
        </LocalizationProvider>
      )}
    </div>
  );
};

export default Rebook;
