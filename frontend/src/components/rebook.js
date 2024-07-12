import React, { useEffect, useState } from "react";
import "./history.css";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs from "dayjs";

const Rebook = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
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
          console.log("result is ", result);
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
    setSelectedDate(date);
    // send request to backend
    const obj = {
      room_id: history[0].room_id,
      date: date.format("YYYY-MM-DD"),
      start_time: formatTime(history[0].start_time),
      end_time: formatTime(history[0].end_time),
    };
    const token = localStorage.getItem("token");
    console.log("object is ", obj);

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
        console.log("successfully sent");
        const result = await response.json();
        console.log(result);
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

  useEffect(() => {
    if (isCalendarVisible === false) {
      console.log(selectedDate);
    }
  }, [selectedDate, isCalendarVisible]);

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
        <h1>Last Booking:</h1>
      </header>
      {history[0] ? (
        <TableContainer>
          <Table aria-label="simple table">
            <TableBody>
              {history.map((row) => (
                <TableRow key={row.booking_id} align="center">
                  <TableCell align="center">
                    {row.start_time} - {row.end_time}
                  </TableCell>
                  <TableCell align="center">{row.room_name}</TableCell>
                  <TableCell
                    align="center"
                    id={row.booking_id}
                    onClick={(e) => toggleCalendarVisibility(e)}
                    style={{ cursor: "pointer", color: "red" }}
                  >
                    {isCalendarVisible ? "Hide Calendar" : "Rebook"}
                  </TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <div className="no-history">No previous reservation history</div>
      )}
    </div>
  );
};

export default Rebook;
