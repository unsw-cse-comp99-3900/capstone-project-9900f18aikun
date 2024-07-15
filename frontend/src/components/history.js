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
import dayjs from "dayjs";

const ReservationHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [calendarPosition, setCalendarPosition] = useState({ x: 0, y: 0 });
  const [change, setChange] = useState(false);
  const [obj, setObj] = useState({});

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
        console.log("successfully sent");
        const result = await response.json();
        setChange(!change);
      } else {
        const errorText = await response.text();
        console.error("Server responded with an error:", errorText);
        throw new Error("Something went wrong");
      }
    } catch (error) {
      console.error("Error fetching booking data:", error);
    }
    setIsCalendarVisible(!isCalendarVisible);
  };

  const disableDates = (date) => {
    const today = dayjs();
    const sevenDaysFromNow = today.add(7, "day");
    return date.isBefore(today, "day") || date.isAfter(sevenDaysFromNow, "day");
  };

  if (loading) {
    return <div>Loading...</div>;
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
        <TableContainer>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell align="center">Date</TableCell>
                <TableCell align="center">Time</TableCell>
                <TableCell align="center">Room</TableCell>
                <TableCell align="center">Booking Status</TableCell>
                <TableCell align="center">Operation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((row) => (
                <TableRow key={row.booking_id} align="center">
                  <TableCell component="th" scope="row" align="center">
                    {row.date}
                  </TableCell>
                  <TableCell align="center">
                    {row.start_time} - {row.end_time}
                  </TableCell>
                  <TableCell align="center">{row.room_name}</TableCell>
                  <TableCell align="center">{row.booking_status}</TableCell>
                  <TableCell
                    align="center"
                    id={row.booking_id}
                    onClick={(e) => cancelHandler(row, e)}
                    style={{ cursor: "pointer", color: "red" }}
                  >
                    {row.booking_status === "cancelled" ||
                    row.booking_status === "completed"
                      ? isCalendarVisible
                        ? "Hide Calendar"
                        : "Rebook"
                      : "Cancel"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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

export default ReservationHistory;
