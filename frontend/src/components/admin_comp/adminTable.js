import React, { useEffect, useState } from "react";
import "../Table.css";
import axios from "axios";
import { Button } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs from "dayjs";
import ToMap from "../toMap";

// get sydney time
const getSydneyTime = async (setErrorMessage) => {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch("/api/admin/time", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + token,
      },
    });

    if (response.ok) {
      const res = await response.json();
      const datetime = new Date(res.datetime);
      return datetime;
    } else {
      const errorText = await response.text();
      setErrorMessage("Failed to Fetch Time\nPlease Refresh");
      throw new Error("Something went wrong");
    }
  } catch (error) {
    setErrorMessage("Failed to Fetch Time\nPlease Refresh");
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
  selectedDate,
  change,
  setChange,
  setErrorMessage,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [zID, setZID] = useState("");

  if (!visible) return null;
  const style = {
    top: position.top,
    left: position.left,
  };

  // get next x hours
  const gettimeList = (time, idx) => {
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

      times.push(time);
      baseTime.setMinutes(baseTime.getMinutes() + 30);
    }

    return times;
  };

  const dropdownTime = gettimeList(time, 8);

  // confirm selection function
  const confirmHandler = async (change, setChange) => {
    const newTimes = gettimeList(time, selectedIdx);

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
      user_id: zID,
      room_id: roomid,
      date: selectedDate.format("YYYY-MM-DD"),
      start_time: newTimes[0],
      end_time: endTime,
    };
    const token = localStorage.getItem("token");

    // console.log({
    //   obj,
    //   zID,
    // });

    try {
      const response = await fetch("/api/booking/admin_book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(obj),
      });

      if (response.ok) {
        await response.json();
        setChange(!change);
        setErrorMessage("Successfully Booked");
      } else {
        const errorText = await response.text();
        setErrorMessage(
          "Booking Failed.\nYou can only book up to 8 hours a day"
        );
        throw new Error("Something went wrong");
      }
    } catch (error) {
      setErrorMessage("Booking Failed.\nYou can only book up to 8 hours a day");
    }

    close();
    setChange(!change);
  };

  const handleZIDChange = (e) => {
    const value = e.target.value;
    setZID(value);
  };

  return (
    <div className="select-window" style={style}>
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
          </select>
        </div>
        <div>
          <label htmlFor="zid-input">for zID:</label>
          <input
            type="text"
            id="zid-input"
            value={zID}
            onChange={handleZIDChange}
            maxLength={8}
            title="zID must start with 'z' followed by 7 digits"
          />
        </div>
        <br />
        <div className="button-class">
          <Button
            onClick={() => {
              confirmHandler(change, setChange);
            }}
            disabled={zID.length === 0}
          >
            Confirm
          </Button>
          <Button onClick={close}>Close</Button>
        </div>
      </>
    </div>
  );
};

// main table
const Table = ({
  data,
  selectedDate,
  setSelectedDate,
  change,
  setChange,
  setErrorMessage,
}) => {
  const [reservations, setReservations] = useState([]);
  const [times, setTimes] = useState([]);
  const [pastTimes, setPastTimes] = useState([]);
  const [selectWindow, setSelectWindow] = useState({
    visible: false,
    time: "",
    room: "",
    roomid: "",
    position: { top: 0, left: 0 },
    permission: "",
    change: change,
    setChange: setChange,
    setErrorMessage: setErrorMessage,
  });
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [hoveredRoom, setHoveredRoom] = useState(null);

  useEffect(() => {
    setReservations(extractData(data, false));
  }, [data]);

  const extractData = (data, self) => {
    return data.map((item) => ({
      room: item.name,
      roomid: item.id,
      permission: item.permission,
      is_available: item.is_available,
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
      console.log("currenttime is ", currentTime.getHours(), "past is ", past);
      setPastTimes(past);
    };

    calculatePastTimes();
  }, [times]);

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
    const target = event.target;

    if (target.classList.contains("disabled")) {
      return;
    }
    const position = { top: event.clientY, left: event.clientX };
    setSelectWindow({
      visible: true,
      time,
      room,
      roomid,
      position,
      change,
      setChange,
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
              style={{ backgroundColor: "#b9b9b9" }}
            ></div>
            <div className="legend-text">Reserved</div>
          </div>
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
              style={{ backgroundColor: "#fce8a3" }}
            ></div>
            <div className="legend-text">Available</div>
          </div>
        </div>

        <div className="singletable-wrapper">
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
              {reservations && reservations.length > 0 ? (
                reservations.map((item) => {
                  const roomData = data.find((d) => d.name === item.room);
                  return (
                    <tr key={item.room} id={item.roomid}>
                      <td
                        className="room-column"
                        onMouseEnter={() => setHoveredRoom(roomData)}
                        onMouseLeave={() => setHoveredRoom(null)}
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

                      {times && times.length > 0 ? (
                        times.map((time) => {
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
                                if (isPast || !item.is_available) {
                                  return "disabled";
                                } else if (isReserved) {
                                  return "reserved";
                                } else {
                                  return "";
                                }
                              })()}`}
                              onClick={async (event) => {
                                event.stopPropagation();
                                if (!isPast) {
                                  clickHandler(
                                    item.room,
                                    time,
                                    event,
                                    item.roomid
                                  );
                                }
                              }}
                            >
                              <div className="box"></div>
                            </td>
                          );
                        })
                      ) : (
                        <td colSpan={times ? times.length : 1}>
                          No available times
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={times ? times.length : 1}>
                    No available reservations
                  </td>
                </tr>
              )}
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
        selectedDate={selectedDate}
        reservations={reservations}
        change={change}
        setChange={setChange}
        setErrorMessage={setErrorMessage}
      />
    </div>
  );
};

export default Table;
