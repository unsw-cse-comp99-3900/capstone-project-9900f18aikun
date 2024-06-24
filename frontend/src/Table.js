import React, { useEffect, useState } from "react";
// import ReactDOM from 'react-dom';
// import { createRoot } from 'react-dom/client';
import "./Table.css";
import axios from "axios";
import { Button } from "@mui/material";
// backup classroom, update when backend connected
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs from "dayjs";

const classroom = ["301 A", "301 B", "301 C", "302", "303"];

let selfReservation = [
  {
    room: "303",
    time: [
      {
        date: "24/06/2024",
        timeslot: ["02:00 PM", "04:00 PM"],
      },
      {
        date: "25/06/2024",
        timeslot: ["02:00 PM", "04:00 PM"],
      },
    ],
  },
];

let reservations = [
  {
    room: "302",
    time: [{ date: "24/06/2024", timeslot: ["02:00 PM", "03:00 PM"] }],
  },
];

// const times = [
//   '12:00 am', '1:00 am', '2:00 am', '3:00 am', '4:00 am', '5:00 am', '6:00 am', '7:00 am',
//   '8:00 am', '9:00 am', '10:00 am', '11:00 am', '12:00 pm', '1:00 pm', '2:00 pm', '3:00 pm',
//   '4:00 pm', '5:00 pm', '6:00 pm', '7:00 pm', '8:00 pm', '9:00 pm', '10:00 pm', '11:00 pm'
// ];

// get sydney time
const getSydneyTime = async () => {
  try {
    const response = await axios.get(
      "http://worldtimeapi.org/api/timezone/Australia/Sydney"
    );
    const datetime = new Date(response.data.datetime);
    return datetime;
  } catch (error) {
    console.error("Error fetching Sydney time:", error);
    return new Date(); // Fallback to local time in case of error
  }
};

// get time for table column
const getTime = async (selectedDate) => {
  const times = [];
  const cur = await getSydneyTime();
  const curDate = dayjs(cur);

  // if today, only show available time
  if (selectedDate.isSame(curDate, "day")) {
    const minutes = cur.getMinutes();

    // show whole hour before 15 or after 45, otherwise show half an hour
    if (minutes < 15) {
      cur.setMinutes(0, 0, 0);
    } else if (minutes < 45) {
      cur.setMinutes(30, 0, 0);
    } else {
      cur.setHours(cur.getHours() + 1);
      cur.setMinutes(0, 0, 0);
    }

    // timeslot next 12 hours
    for (let i = 0; i < 48; i++) {
      times.push(
        cur.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
      cur.setMinutes(cur.getMinutes() + 30);
      if (cur.getHours() === 0) {
        break;
      }
    }

    // if other days, show all time
  } else {
    const date = new Date(selectedDate.format("YYYY-MM-DD"));
    date.setHours(0, 0, 0, 0);
    for (let i = 0; i < 48; i++) {
      times.push(
        date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
      date.setMinutes(date.getMinutes() + 30);
    }
  }
  return times;
};

// dropdown list function
const SelectWindow = ({
  visible,
  time,
  room,
  position,
  close,
  self,
  selectedDate,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [limit, setLimit] = useState(false);
  if (!visible) return null;

  const style = {
    top: position.top,
    left: position.left,
  };

  // get next x hours
  const gettimeList = (time, idx) => {
    const times = [];
    const [hour, minute, period] = time.match(/(\d+):(\d+) (AM|PM)/).slice(1);
    const baseTime = new Date();
    baseTime.setHours((hour % 12) + (period === "PM" ? 12 : 0), minute, 0, 0);

    for (let i = 1; i <= idx; i++) {
      baseTime.setMinutes(baseTime.getMinutes() + 30);
      times.push(
        baseTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    }

    return times;
  };

  const dropdownTime = gettimeList(time, 8);

  // confirm selection function
  const confirmHandler = () => {
    const newTimes = gettimeList(time, selectedIdx);
    newTimes.push(time);
    console.log(newTimes)
    // Total booked hours calculation
    const totalBooked = self.reduce((total, reservation) => {
      reservation.time.forEach((slot) => {
        if (slot.date === selectedDate.format("DD/MM/YYYY")) {
          total += slot.timeslot.length;
        }
      });
      return total;
    }, 0);
    console.log(self)
    console.log(totalBooked)
    if (totalBooked + newTimes.length > 16) {
      setLimit(true);
      return;
    }

    // if already has reservation for this day
    const existing = self.find((reservation) => reservation.room === room);
    if (existing) {
      const existingDate = existing.time.find(
        (date) => date.date === selectedDate.format("DD/MM/YYYY")
      );
      if (existingDate) {
        existingDate.timeslot.push(...newTimes);
      } else {
        existing.time.push({
          date: selectedDate.format("DD/MM/YYYY"),
          timeslot: newTimes,
        });
      }
      // if no reservation for this day
    } else {
      self.push({
        room,
        time: [{ date: selectedDate.format("DD/MM/YYYY"), timeslot: newTimes }],
      });
    }
    console.log(self);
    close();
  };

  return (
    <div className="select-window" style={style}>
      {limit ? (
        <div
          style={{
            style
          }}
        >
          <p>
            Booking limit exceeded for the day. You cannot book more than 8
            hours for one day.
          </p>
          <Button
            onClick={() => {
              setLimit(false);
              setSelectedIdx(1);
              close();
            }}
          >
            Close
          </Button>
        </div>
      ) : (
        <>
          <div>
            <strong>{room}</strong>: {time} until...
            <select
              id="dropdown"
              onChange={(e) => setSelectedIdx(e.target.selectedIndex)}
            >
              {dropdownTime.map((time, idx) => (
                <option key={idx} value={idx}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          <br />
          <div className="button-class">
            <Button onClick={confirmHandler}>Confirm</Button>
            <Button onClick={close}>Close</Button>
          </div>
        </>
      )}
    </div>
  );
};

// main table
const Table = () => {
  const [times, setTimes] = useState([]);
  const [selectWindow, setSelectWindow] = useState({
    visible: false,
    time: "10:00 AM",
    room: "302",
    position: { top: 0, left: 0 },
    self: selfReservation,
  });
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const toggleCalendarVisibility = () => {
    setIsCalendarVisible(!isCalendarVisible);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setIsCalendarVisible(false);
  };

  useEffect(() => {
    const fetchTimes = async () => {
      const newTimes = await getTime(selectedDate);
      setTimes(newTimes);
    };

    fetchTimes();

    const timer = setInterval(async () => {
      const newTimes = await getTime(selectedDate);
      setTimes(newTimes);
    }, 60000);
    return () => clearInterval(timer);
  }, [selectedDate]);

  // allows popup when clicked on a given timeslot
  const clickHandler = (room, time, event) => {
    const target = event.target;
    if (target.classList.contains("reserved")) {
      return;
    }

    const position = { top: event.clientY + 10, left: event.clientX + 10 };
    setSelectWindow({
      visible: true,
      room,
      time,
      position,
      self: selfReservation,
    });
  };

  const hideSelectWindow = () => {
    setSelectWindow({ ...selectWindow, visible: false });
  };

  const disableDates = (date) => {
    const today = dayjs();
    const sevenDaysFromNow = today.add(7, "day");
    return date.isBefore(today, "day") || date.isAfter(sevenDaysFromNow, "day");
  };

  return (
    <div className="table-container">
      <div className="calendar-container">
        <Button
          onClick={toggleCalendarVisibility}
          variant="contained"
          color="info"
        >
          {isCalendarVisible ? "Hide Calendar" : "Go to Date"}
        </Button>
        {isCalendarVisible && (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              shouldDisableDate={disableDates}
              className="date-calendar-overlay"
              onChange={handleDateChange}
            />
          </LocalizationProvider>
        )}
        <div>
          <strong>Chosen Date: </strong>
          {selectedDate.format("dddd, MMMM D, YYYY")}
        </div>
      </div>

      <div className="table-wrapper">
        <table id="mytable">
          <thead>
            <tr>
              <th>Select Space</th>
              {times.map((time) => (
                <th key={time} className="time-column">
                  {time}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* map room to time */}
            {classroom.map((room) => (
              <tr key={room}>
                <td className="room-column">{room}</td>
                {times.map((time) => {
                  // define reserved class
                  const isReserved = reservations.some(
                    (reservation) =>
                      reservation.room === room &&
                      reservation.time.some(
                        (slot) =>
                          slot.date === selectedDate.format("DD/MM/YYYY") &&
                          slot.timeslot.includes(time)
                      )
                  );

                  // define reserved by current user class
                  const isSelfReserved = selfReservation.some(
                    (reservation) =>
                      reservation.room === room &&
                      reservation.time.some(
                        (slot) =>
                          slot.date === selectedDate.format("DD/MM/YYYY") &&
                          slot.timeslot.includes(time)
                      )
                  );

                  return (
                    <td
                      key={time}
                      className={`time-column ${
                        isReserved
                          ? "reserved"
                          : isSelfReserved
                          ? "selfreserved"
                          : ""
                      }`}
                      onClick={(event) => {
                        event.stopPropagation(); // Prevent triggering the hideSelectWindow
                        clickHandler(room, time, event);
                      }}
                    ></td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SelectWindow
        visible={selectWindow.visible}
        room={selectWindow.room}
        position={selectWindow.position}
        close={hideSelectWindow}
        time={selectWindow.time}
        self={selectWindow.self}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default Table;
