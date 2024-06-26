import React, { useEffect, useState } from "react";
import "./Table.css";
import axios from "axios";
import { Button } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs from "dayjs";

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
  roomid,
  position,
  close,
  self,
  selectedDate,
  reservations,
  permission,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [limit, setLimit] = useState(false);
  if (!visible) return null;

  console.log(permission);

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

    // getting end time
    const [hour, minute] = newTimes[newTimes.length - 1].split(":").map(Number);
    let endTime = new Date();
    endTime.setHours(hour, minute + 30, 0, 0);
    endTime = endTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // send request to backend
    const obj = {
      room_id: roomid,
      date: selectedDate.format("YYYY-MM-DD"),
      start_time: newTimes[0],
      end_time: endTime,
    };
    console.log("object is", obj);

    try {
      const response = await fetch("/api/booking/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization:
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

    // reservation
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
            <Button onClick={confirmHandler}>
              {permission ? "Confirm" : "Request"}
            </Button>
            <Button onClick={close}>Close</Button>
          </div>
        </>
      )}
    </div>
  );
};

// main table
const Table = ({ data,selectedDate, setSelectedDate }) => {
  const [reservations, setReservations] = useState([]);
  const [selfReservations, setSelfReservations] = useState([]);
  const [times, setTimes] = useState([]);
  const [selectWindow, setSelectWindow] = useState({
    visible: false,
    time: "",
    room: "",
    roomid: "",
    position: { top: 0, left: 0 },
    self: selfReservations,
    permission: false,
  });
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  // const [selectedDate, setSelectedDate] = useState(dayjs());
  const [hoveredRoom, setHoveredRoom] = useState(null);
  console.log("reservation is", reservations);

  useEffect(() => {
    setReservations(extractData(data, false));
    setSelfReservations(extractData(data, true));
  }, [data]);

  const extractData = (data, self) => {
    return data.map((item) => ({
      room: item.name,
      roomid: item.id,
      permission: item.HDR_student_permission,
      time: [
        {
          date: selectedDate.format("DD/MM/YYYY"),
          timeslot: extractTime(
            item.time_table,
            self,
            item.permission
          ),
        },
      ],
    }));
  };

  const extractTime = (timeTable, self, permission) => {
    const timeslots = [];
    timeTable.forEach((slot, index) => {
      if (!Array.isArray(slot)) {
        const include = self
          ? slot.current_user_booking
          : !slot.current_user_booking;
        if (include) {
          const hour = Math.floor(index / 2);
          const minute = index % 2 === 0 ? "00" : "30";
          const time = `${hour.toString().padStart(2, "0")}:${minute}`;
          timeslots.push({ time, permission });
        }
      }
    });
    return timeslots;
  };

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
  const clickHandler = (room, time, event, roomid) => {
    console.log(room, roomid);
    const target = event.target;
    console.log("Class name:", target.className);
    if (
      target.classList.contains("reserved") ||
      target.classList.contains("selfreserved")
    ) {
      return;
    }

    const position = { top: event.clientY + 10, left: event.clientX - 200 };
    setSelectWindow({
      visible: true,
      time,
      room,
      roomid,
      position,
      self: selfReservations,
      permission: false,
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

      <div className="legend">
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: "#b9b9b9" }}
          ></div>
          <div className="legend-text">Reserved By Others</div>
        </div>
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: "#4c2d83" }}
          ></div>
          <div className="legend-text">Self-Reserved</div>
        </div>
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: "#fce8a3" }}
          ></div>
          <div className="legend-text">Available</div>
        </div>
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: "rgb(221, 216, 169)" }}
          ></div>
          <div className="legend-text">Booking Request Required</div>
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
            {reservations.map((item) => {
              const roomData = data.find((d) => d.name === item.room);
              return (
                <tr key={item.room} id={item.roomid}>
                  <td
                    className="room-column"
                    onMouseEnter={() => setHoveredRoom(roomData)}
                    onMouseLeave={() => setHoveredRoom(null)}
                    style={{ position: "relative", zIndex: 2 }}
                  >
                    {item.room}
                    {hoveredRoom && hoveredRoom.name === item.room && (
                      <div className="room-info">
                        <p>Name: {hoveredRoom.name}</p>
                        <p>Building: {hoveredRoom.building}</p>
                        <p>Level: {hoveredRoom.level}</p>
                        <p>Capacity: {hoveredRoom.capacity}</p>
                      </div>
                    )}
                  </td>
                  {times.map((time) => {
                    const isReserved = reservations.some(
                      (reservation) =>
                        reservation.room === item.room &&
                        reservation.time.some(
                          (slot) =>
                            slot.date === selectedDate.format("DD/MM/YYYY") &&
                            slot.timeslot.some(
                              (t) => t.time === time && !t.permission
                            )
                        )
                    );

                    // define reserved by current user class
                    const isSelfReserved = selfReservations.some(
                      (reservation) =>
                        reservation.room === item.room &&
                        reservation.time.some(
                          (slot) =>
                            slot.date === selectedDate.format("DD/MM/YYYY") &&
                            slot.timeslot.some(
                              (t) => t.time === time && t.permission
                            )
                        )
                    );

                    const timeSlot = reservations.find(
                      (reservation) =>
                        reservation.room === item.room &&
                        reservation.time.some(
                          (slot) =>
                            slot.date === selectedDate.format("DD/MM/YYYY") &&
                            slot.timeslot.some((t) => t.time === time)
                        )
                    );

                    const permission = timeSlot
                      ? timeSlot.time[0].timeslot.find((t) => t.time === time)
                          .permission
                      : false;

                    return (
                      <td
                        key={time}
                        className={`time-column ${
                          isReserved
                            ? "reserved"
                            : isSelfReserved
                            ? "selfreserved"
                            : permission
                            ? ""
                            : "no-permission"
                        }`}
                        onClick={(event) => {
                          event.stopPropagation();
                          clickHandler(item.room, time, event, item.roomid);
                        }}
                      ></td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <SelectWindow
        visible={selectWindow.visible}
        room={selectWindow.room}
        roomid={selectWindow.roomid}
        position={selectWindow.position}
        close={hideSelectWindow}
        time={selectWindow.time}
        self={selectWindow.self}
        selectedDate={selectedDate}
        reservations={reservations}
        permission={selectWindow.permission}
      />
    </div>
  );
};

export default Table;
