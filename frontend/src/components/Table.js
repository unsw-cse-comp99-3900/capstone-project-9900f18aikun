import React, { useEffect, useState } from "react";
import "./Table.css";
import axios from "axios";
import { Button } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs from "dayjs";
import ToMap from "./toMap";
import { Navigate, useNavigate } from "react-router-dom";
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
  change,
  setChange,
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
    const token = localStorage.getItem("token");
    // console.log("object is", obj);

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
        setChange(!change);
        console.log(obj)
      //   // reservation
      //   // if already has reservation for this day
      //   const existing = self.find((reservation) => reservation.room === room);
      //   if (existing) {
      //     const existingDate = existing.time.find(
      //       (date) => date.date === selectedDate.format("DD/MM/YYYY")
      //     );
      //     if (existingDate) {
      //       existingDate.timeslot.push(...newTimes);
      //     } else {
      //       existing.time.push({
      //         date: selectedDate.format("DD/MM/YYYY"),
      //         timeslot: newTimes,
      //       });
      //     }
      //     // if no reservation for this day
      //   } else {
      //     self.push({
      //       room,
      //       time: [
      //         { date: selectedDate.format("DD/MM/YYYY"), timeslot: newTimes },
      //       ],
      //     });
      //   }
      } else {
        const errorText = await response.text();
        console.error("Server responded with an error:", errorText);
        throw new Error("Something went wrong");
      }
    } catch (error) {
      console.error("Error fetching booking data:", error);
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
const Table = ({ data, selectedDate, setSelectedDate, change, setChange }) => {
  console.log("data is ", data);
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
    permission: "",
    change: change,
    setChange: setChange,
  });
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  // const [selectedDate, setSelectedDate] = useState(dayjs());
  const [hoveredRoom, setHoveredRoom] = useState(null);
  // console.log("reservation is", reservations);
  // console.log("selfReservation is", selfReservations);

  const navigate = useNavigate();

  useEffect(() => {
    setReservations(extractData(data, false));
    setSelfReservations(extractData(data, true));
  }, [data]);

  const extractData = (data, self) => {
    return data.map((item) => ({
      room: item.name,
      roomid: item.id,
      permission: item.permission,
      time: [
        {
          date: selectedDate.format("DD/MM/YYYY"),
          timeslot: extractTime(item.time_table, self),
        },
      ],
    }));
  };

  const extractTime = (timeTable, self) => {
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
          timeslots.push(time);
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

  // Scroll to the current time slot when times are updated
  useEffect(() => {
    const scrollToCurrentTime = async () => {
      const currentTime = await getSydneyTime();

      const minutes = currentTime.getMinutes();

      // show whole hour before 15 or after 45, otherwise show half an hour
      if (minutes < 15) {
        currentTime.setMinutes(0, 0, 0);
      } else if (minutes < 45) {
        currentTime.setMinutes(30, 0, 0);
      } else {
        currentTime.setHours(currentTime.getHours() + 1);
        currentTime.setMinutes(0, 0, 0);
      }

      const cur = currentTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const currentTimeIndex = times.indexOf(cur);

      if (currentTimeIndex !== -1) {
        const table = document.getElementById("mytable");
        const currentTimeCell = table.querySelector(
          `thead th:nth-child(${currentTimeIndex})`
        );

        if (currentTimeCell) {
          currentTimeCell.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "start",
          });
        }
      }
    };

    if (times.length > 0) {
      const today = dayjs().format("YYYY-MM-DD");
      if (selectedDate.format("YYYY-MM-DD") === today) {
        scrollToCurrentTime();
      }
    }
  }, [times, selectedDate]);

  // allows popup when clicked on a given timeslot
  const clickHandler = (room, time, event, roomid) => {
    const className = event.currentTarget.className;
    console.log("classname is ", className);
    let permissionClass = "";

    if (className.includes("reserved")) {
      permissionClass = false;
    } else if (className.includes("selfreserved")) {
      permissionClass = false;
    } else if (className.includes("no-permission")) {
      permissionClass = false;
    } else {
      permissionClass = true;
    }
    const target = event.target;

    if (
      target.classList.contains("reserved") ||
      target.classList.contains("selfreserved")
    ) {
      return;
    }

    const position = { top: event.clientY, left: event.clientX };
    setSelectWindow({
      visible: true,
      time,
      room,
      roomid,
      position,
      self: selfReservations,
      permission: permissionClass, // Set the permission class
      change: change,
      setChange: setChange,
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
  const [pastTimes, setPastTimes] = useState([]);

  useEffect(() => {
    const calculatePastTimes = async () => {
      const currentTime = await getSydneyTime();
      const past = times.filter((time) => {
        const [timeHours, timeMinutes] = time.split(":").map(Number);
        return (
          currentTime.getHours() > timeHours ||
          (currentTime.getHours() === timeHours &&
            currentTime.getMinutes() >= timeMinutes + 15)
        );
      });
      setPastTimes(past);
    };

    calculatePastTimes();
  }, [times]);

  return (
    <div>
      <div className="table-container">
        <div className="calendar-container">
          <div className="calendar-row">
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
            <div className="calendar-text">
              <strong>Chosen Date: </strong>
              {selectedDate.format("dddd, MMMM D, YYYY")}
            </div>
          </div>
          <div className="to-map">
            <ToMap />
          </div>
        </div>

        <div className="legend">
          <div className="legend-item">
            <div
              className="legend-color"
              style={{ backgroundColor: "#ffcccc" }}
            ></div>
            <div className="legend-text">Disabled Public Use</div>
          </div>
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
                <th className="select-space">Select Space</th>
                {times.map((time) => (
                  <th key={time} className="time-column">
                    {time}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reservations.map((item) => {
                const permission = item.permission;
                const roomData = data.find((d) => d.name === item.room);
                return (
                  <tr key={item.room} id={item.roomid}>
                    <td
                      className="room-column"
                      onMouseEnter={() => setHoveredRoom(roomData)}
                      onMouseLeave={() => setHoveredRoom(null)}
                      onClick={() => {
                        navigate("/room/" + item.roomid);
                      }}
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
                      let isPast = false;
                      const today = dayjs().format("YYYY-MM-DD");
                      if (selectedDate.format("YYYY-MM-DD") === today) {
                        isPast = pastTimes.includes(time);
                      }
                      return (
                        <td
                          key={time}
                          className={`time-column ${(() => {
                            const isReserved = reservations.some(
                              (reservation) =>
                                reservation.room === item.room &&
                                reservation.time.some(
                                  (slot) =>
                                    slot.date ===
                                      selectedDate.format("DD/MM/YYYY") &&
                                    slot.timeslot.some((t) => t === time)
                                )
                            );

                            const isSelfReserved = selfReservations.some(
                              (reservation) =>
                                reservation.room === item.room &&
                                reservation.time.some(
                                  (slot) =>
                                    slot.date ===
                                      selectedDate.format("DD/MM/YYYY") &&
                                    slot.timeslot.some((t) => t === time)
                                )
                            );
                            if (isPast) {
                              return "disabled";
                            } else if (isSelfReserved) {
                              return "selfreserved";
                            } else if (isReserved) {
                              return "reserved";
                            } else if (permission) {
                              return "permission";
                            } else {
                              return "no-permission";
                            }
                          })()}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!isPast) {
                              clickHandler(item.room, time, event, item.roomid);
                            }
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
        change={change}
        setChange={setChange}
      />
    </div>
  );
};

export default Table;
