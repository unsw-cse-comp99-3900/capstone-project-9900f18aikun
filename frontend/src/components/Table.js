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

// const classroom = ["301 A", "301 B", "301 C", "302", "303"];

let selfReservation = [
  {
    room: "303",
    time: [
      {
        date: "24/06/2024",
        timeslot: ["14:00", "16:00"],
      },
      {
        date: "25/06/2024",
        timeslot: ["14:00", "16:00"],
      },
    ],
  },
];

// let reservations = [
//   {
//     room: "302",
//     time: [
//       { date: "25/06/2024", timeslot: ["1:00", "15:00", "16:30", "17:00"] },
//     ],
//   },
// ];

// const times = [
//   '12:00 am', '1:00 am', '2:00 am', '3:00 am', '4:00 am', '5:00 am', '6:00 am', '7:00 am',
//   '8:00 am', '9:00 am', '10:00 am', '11:00 am', '12:00 pm', '1:00 pm', '2:00 pm', '3:00 pm',
//   '4:00 pm', '5:00 pm', '6:00 pm', '7:00 pm', '8:00 pm', '9:00 pm', '10:00 pm', '11:00 pm'
// ];

// get sydney time
const getSydneyTime = async () => {
  while (true) {
    try {
      const response = await axios.get(
        "http://worldtimeapi.org/api/timezone/Australia/Sydney"
      );
      const datetime = new Date(response.data.datetime);
      return datetime;
    } catch (error) {
      console.error("Error fetching Sydney time:", error);
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
};

// get time for table column
const getTime = async (selectedDate) => {
  const times = [];
  const cur = await getSydneyTime();

  // if today, only show available time
  if (selectedDate.isSame(cur, "day")) {
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
          hour12: false,
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
          hour12: false,
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
  reservations,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [limit, setLimit] = useState(false);
  if (!visible) return null;

  const style = {
    top: position.top,
    left: position.left,
  };

  // already reserved time
  const reserved = [...reservations, ...self]
    .filter((reservation) => reservation.room === room)
    .flatMap((reservation) =>
      reservation.time
        .filter((slot) => slot.date === selectedDate.format("DD/MM/YYYY"))
        .flatMap((slot) => slot.timeslot)
    );

  // get next x hours
  const gettimeList = (time, idx, reserved) => {
    const times = [];
    const [hour, minute] = time.split(":").map(Number);
    const baseTime = new Date();
    baseTime.setHours(hour, minute, 0, 0);

    for (let i = 0; i <= idx; i++) {
      const time = baseTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      // stop if meets a already reserved spot
      if (reserved.includes(time)) {
        break;
      }
      times.push(time);
      baseTime.setMinutes(baseTime.getMinutes() + 30);
    }

    return times;
  };

  const dropdownTime = gettimeList(time, 8, reserved);

  // confirm selection function
  const confirmHandler = async () => {
    const newTimes = gettimeList(time, selectedIdx, reserved);
    // newTimes.push(time);

    // Total booked hours calculation
    const totalBooked = self.reduce((total, reservation) => {
      reservation.time.forEach((slot) => {
        if (slot.date === selectedDate.format("DD/MM/YYYY")) {
          total += slot.timeslot.length;
        }
      });
      return total;
    }, 0);
    if (totalBooked + newTimes.length > 16) {
      setLimit(true);
      return;
    }

    const obj = {
      "room_id": "3",
      "date": selectedDate.format("YYYY-MM-DD"),
      "start_time": newTimes[0],
      "end_time": newTimes[newTimes.length - 1],
    };
    console.log("object is", obj)
    try {
      const response = await fetch("/api/booking/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization":
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcxOTExNTc5OSwianRpIjoiYzA5Y2IwZTEtYzFjYS00ZDY4LTg5NTAtMTI2MGQ4NzIwMGEyIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6eyJ6aWQiOiJ6MTEzMzAifSwibmJmIjoxNzE5MTE1Nzk5LCJjc3JmIjoiZjlmMGI0YmItMTgwYi00ZDllLThlNGYtN2I4MTk4OWNhMzllIiwiZXhwIjo3NzE5MTE1NzM5fQ.ZU768uMtq-LuJZYOjznoIb3zNha0XDvQu7JH8AYls1w",
        },
        body: JSON.stringify(obj),
      });

      if (response.ok) {
        console.log("Successfully sent");
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
    // };

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
    close();
  };

  return (
    <div className="select-window" style={style}>
      {limit ? (
        <div style={{ style }}>
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
              {dropdownTime.map((time, idx) => {
                const [hour, minute] = time.split(":").map(Number);
                let endTime = new Date();
                endTime.setHours(hour, minute + 30, 0, 0);
                endTime = endTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });
                return (
                  <option key={idx} value={idx}>
                    {endTime}
                  </option>
                );
              })}
              ;
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
const Table = ({ data }) => {
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    const reserved = extractData(data);
    setReservations(reserved);
    // console.log("Filtered Data:", reserved);
  }, [data]);

  const extractData = (data) => {
    return data.map((item) => ({
      room: item.name,
      time: [
        {
          date: selectedDate.format("DD/MM/YYYY"),
          timeslot: extractTime(item.time_table),
        },
      ],
    }));
  };

  const extractTime = (timeTable) => {
    const timeslots = [];
    // Assuming timetable splitted by half an hour
    timeTable.forEach((slot, index) => {
      if (Array.isArray(slot) && slot.length > 0) {
        const hour = Math.floor(index / 2);
        const minute = index % 2 === 0 ? "00" : "30";
        const time = `${hour.toString().padStart(2, "0")}:${minute}`;
        timeslots.push(time);
      }
    });
    return timeslots;
  };

  const [times, setTimes] = useState([]);
  const [selectWindow, setSelectWindow] = useState({
    visible: false,
    time: "10:00",
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
  const clickHandler = (room, time, event, idx) => {
    console.log(room, idx)
    const target = event.target;
    if (
      target.classList.contains("reserved") ||
      target.classList.contains("selfreserved")
    ) {
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

  const classroom = reservations.map((item) => item.room);

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
            {classroom.map((idx, room) => (
              <tr key={room} id={idx}>
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
                        clickHandler(room, time, event, idx);
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
        reservations={reservations}
      />
    </div>
  );
};

export default Table;
