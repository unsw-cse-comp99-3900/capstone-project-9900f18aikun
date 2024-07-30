import React, { useEffect, useState } from "react";
import "./history.css";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { Spin, Space, Table as ArcoTable, Notification } from "@arco-design/web-react";
import dayjs from "dayjs";
import ErrorBox from "./errorBox";

const ReservationHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [calendarPosition, setCalendarPosition] = useState({ x: 0, y: 0 });
  const [change, setChange] = useState(false);
  const [obj, setObj] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

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
          console.log("history result is ", result);
          setHistory(result);
        } else {
          const errorText = await response.text();
          setErrorMessage(errorText);
          throw new Error("Server responded with an error: " + errorText);
        }
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [change]);

  useEffect(() => {
    if (errorMessage) {
      Notification.info({
        title: 'Error',
        content: errorMessage,
        duration: 0, // 0 means the notification will not auto close
        onClose: () => setErrorMessage("")
      });
    }
  }, [errorMessage]);

  const toggleCalendarVisibility = (e) => {
    setIsCalendarVisible(!isCalendarVisible);
    setCalendarPosition({ x: e.clientX, y: e.clientY });
  };

  function formatTime(time) {
    let [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  }

  const cancelHandler = async (entry, e) => {
    console.log(e.target.innerText);
    if (e.target.innerText === "Cancel") {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch("/api/booking/book/" + entry.booking_id, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + token,
          },
          // body: JSON.stringify(obj),
        });

        if (response.ok) {
          setChange(!change);
          // if no reservation for this day
        } else {
          const errorText = await response.text();
          setErrorMessage(errorText);
          console.error("Server responded with an error:", errorText);
          throw new Error("Something went wrong");
        }
      } catch (error) {
        console.error("Error fetching booking data:", error);
      }
    } else if (e.target.innerText === "Rebook") {
      toggleCalendarVisibility(e);
      setObj({
        room_id: entry.room_id,
        start_time: formatTime(entry.start_time),
        end_time: formatTime(entry.end_time),
      });
    } else if (e.target.innerText === "Hide Calendar") {
      toggleCalendarVisibility(e);
    }
  };

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    // send request to backend
    const object = {
      room_id: obj.room_id,
      date: date.format("YYYY-MM-DD"),
      start_time: formatTime(obj.start_time),
      end_time: formatTime(obj.end_time),
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
        body: JSON.stringify(object),
      });

      if (response.ok) {
        setErrorMessage("Successfully Booked");
        const result = await response.json();
        setChange(!change);
      } else {
        const errorText = await response.text();
        setErrorMessage("Booking was Unsuccessful");
        throw new Error("Something went wrong");
      }
    } catch (error) {
      setErrorMessage("Booking was Unsuccessful");
    }
    setIsCalendarVisible(!isCalendarVisible);
  };

  const disableDates = (date) => {
    const today = dayjs();
    const sevenDaysFromNow = today.add(7, "day");
    const tmr = today.add(1, "day");
    return date.isBefore(tmr, "day") || date.isAfter(sevenDaysFromNow, "day");
  };

  const handleExtend = async (entry) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        "/api/booking/extend_book/" + entry.booking_id,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: "Bearer " + token,
          },
        }
      );

      if (response.ok) {
        setErrorMessage("Successfully Extended");
        setChange(!change);
      } else {
        const errorText = await response.text();
        setErrorMessage("Extension was Unsuccessful");
        throw new Error("Something went wrong");
      }
    } catch (error) {
      setErrorMessage("Extension was Unsuccessful");
    }
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      align: "center",
    },
    {
      title: "Time",
      key: "time",
      align: "center",
      render: (_, record) => `${record.start_time} - ${record.end_time}`,
    },
    {
      title: "Room",
      dataIndex: "room_name",
      key: "room_name",
      align: "center",
    },
    {
      title: "Booking Status",
      dataIndex: "booking_status",
      key: "booking_status",
      align: "center",
    },
    {
      title: "Operation",
      key: "operation",
      align: "center",
      render: (_, record) => {
        let text = (
          <img src="/img/Remove.png" alt="No Operation Allowed" />
        );

        if (record.booking_status === "completed") {
          text = isCalendarVisible ? "Hide Calendar" : "Rebook";
        } else if (
          record.booking_status === "booked" ||
          record.booking_status === "requested"
        ) {
          text = "Cancel";
        }
        // const isRebook =
        //   record.booking_status === "cancelled" ||
        //   record.booking_status === "signed-in";
        // const text = isRebook
        //   ? isCalendarVisible
        //     ? "Hide Calendar"
        //     : "Rebook"
        //   : "Cancel";
        const color =
          text === "Cancel" ? "red" : text === "Rebook" ? "green" : "black";

        return (
          <span
            id={record.booking_id}
            onClick={(e) => cancelHandler(record, e)}
            style={{ cursor: "pointer", color }}
          >
            {text}
          </span>
        );
      },
    },
    {
      title: "Extend Booking",
      key: "extend",
      align: "center",
      render: (_, record) => {
        if (record.booking_status === "signed-in") {
          return <input type="checkbox" onClick={() => handleExtend(record)} />;
        } else {
          return <input type="checkbox" disabled={true} />;
        }
      },
    },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <Space size={40}>
          <Spin size={40} />
        </Space>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="reservation-history">
      <header>
        <h1>Reservation History:</h1>
      </header>
      {history.length > 0 ? (
        <div className="history-table">
          <ArcoTable
            columns={columns}
            data={history}
            rowKey="booking_id"
            pagination={6}
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
      {/* {errorMessage && (
        <ErrorBox message={errorMessage} onClose={() => setErrorMessage("")} />
      )} */}
    </div>
  );
};

export default ReservationHistory;
