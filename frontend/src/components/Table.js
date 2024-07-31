import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";

import dayjs from "dayjs";
import ToMap from "./toMap";
import "./Table.css";

// get the current time from backend
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

// select window function
const SelectWindow = ({
  visible,
  time,
  room,
  roomid,
  position,
  close,
  selectedDate,
  reservations,
  permission,
  change,
  setChange,
  setErrorMessage,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [checked, setChecked] = useState(false);
  const [weeks, setWeeks] = useState("");

  if (!visible) return null;

  // Filter the reservations for the selected room and date
  const filteredReservations = reservations.filter(
    (reservation) =>
      reservation.roomid === roomid &&
      reservation.date === selectedDate.format("DD/MM/YYYY")
  );

  // Extract the reserved times from the filtered reservations
  const reserved = filteredReservations.flatMap((reservation) =>
    reservation.spec.map((timeslot) => timeslot.time)
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
      ...(weeks && { weeks_of_duration: parseInt(weeks, 10) }),
    };
    const token = localStorage.getItem("token");
    console.log(obj);
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
        await response.json();
        setChange(!change);
        if (permission) {
          setErrorMessage("Successfully Booked");
        } else {
          setErrorMessage("Successfully Requested");
        }
      } else {
        const errorText = await response.text();
        setErrorMessage("Booking Failed.");
        throw new Error("Something went wrong");
      }
    } catch (error) {
      setErrorMessage("Booking Failed.");
    }

    close();
  };

  const handleCheckboxChange = () => {
    setChecked(!checked);
    if (!checked) {
      setWeeks(""); // Clear the weeks input when checkbox is unchecked
    }
  };

  const handleInputChange = (event) => {
    setWeeks(event.target.value);
  };

  return (
    <div
      className="select-window"
      style={{
        top: position.top,
        left: position.left,
        position: "absolute",
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        padding: "10px",
        zIndex: 100,
      }}
    >
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
        {permission ? (
          <div>
            <label>
              <input
                type="checkbox"
                checked={checked}
                onChange={handleCheckboxChange}
              />
              I want to book for
            </label>
            <input
              type="number"
              value={weeks}
              onChange={handleInputChange}
              disabled={!checked}
              placeholder="Enter number of weeks"
              min="1"
            />
            <span> weeks</span>
          </div>
        ) : (
          <div></div>
        )}
        <br />
        <div className="button-class">
          <Button onClick={confirmHandler}>
            {permission ? "Confirm" : "Request"}
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
  const [times, setTimes] = useState([]);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [hoveredRoom, setHoveredRoom] = useState(null);
  const [pastTimes, setPastTimes] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [selectWindow, setSelectWindow] = useState({
    visible: false,
  });

  const navigate = useNavigate();

  const toggleCalendarVisibility = () => {
    setIsCalendarVisible(!isCalendarVisible);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setIsCalendarVisible(false);
  };

  useEffect(() => {
    const extractTime = (timeTable) => {
      if (!timeTable) {
        return [];
      }
      const timeslots = [];
      timeTable.forEach((slot, index) => {
        if (!Array.isArray(slot) && slot.booking_status !== "cancelled") {
          const hour = Math.floor(index / 2);
          const minute = index % 2 === 0 ? "00" : "30";
          const time = `${hour.toString().padStart(2, "0")}:${minute}`;
          const obj = {
            time: time,
            info: slot,
          };
          timeslots.push(obj);
        }
      });
      return timeslots;
    };

    const extractData = (data) => {
      return data.map((item) => ({
        room: item.name,
        roomid: item.id,
        permission: item.permission,
        is_available: item.is_available,
        date: selectedDate.format("DD/MM/YYYY"),
        spec: extractTime(item.time_table),
      }));
    };
    setReservations(extractData(data));
  }, [data]);

  useEffect(() => {
    const fetchTimes = async () => {
      const newTimes = await getTime(selectedDate);
      setTimes(newTimes);
    };
    fetchTimes();
  }, [selectedDate]);

  useEffect(() => {
    const calculatePastTimes = async () => {
      if (times.length > 0) {
        const today = dayjs().format("YYYY-MM-DD");
        if (selectedDate.format("YYYY-MM-DD") === today) {
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
          return;
        }
      }
      setPastTimes(null);
    };

    const scrollToCurrentTime = async () => {
      console.log("did this happen");
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
        if (table) {
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
      }
    };

    if (times.length > 0) {
      const today = dayjs().format("YYYY-MM-DD");
      if (selectedDate.format("YYYY-MM-DD") === today) {
        scrollToCurrentTime();
      }
    }
    calculatePastTimes();
  }, [times]);

  // handle click on table
  const clickHandler = (room, time, event, roomid) => {
    const target = event.target;
    const targetClassList = target.classList;
    const tdClassList = target.closest("td").classList;
    if (
      targetClassList.contains("reserved") ||
      targetClassList.contains("selfreserved") ||
      targetClassList.contains("disabled") ||
      targetClassList.contains("requested") ||
      tdClassList.contains("reserved") ||
      tdClassList.contains("selfreserved") ||
      tdClassList.contains("disabled") ||
      tdClassList.contains("requested")
    ) {
      return;
    }

    const className = event.currentTarget.className;
    let permissionClass = true;
    if (className.includes("no-permission")) {
      permissionClass = false;
    }
    const dashboardContent = document.querySelector(".dashboard-content");
    const rect = dashboardContent.getBoundingClientRect();
    const position = {
      top: event.clientY - rect.top,
      left: event.clientX - rect.left,
    };
    setSelectWindow({
      visible: true,
      time,
      room,
      roomid,
      position,
      change: change,
      permission: permissionClass,
      setChange: setChange,
      setErrorMessage: setErrorMessage,
    });
  };

  // only allow 7 days selection on calandar
  const disableDates = (date) => {
    const today = dayjs();
    const sevenDaysFromNow = today.add(6, "day");
    return date.isBefore(today, "day") || date.isAfter(sevenDaysFromNow, "day");
  };

  // define td's classname
  const getClassName = (time, room, isPast) => {
    if (!room.is_available || isPast) {
      return "disabled";
    }

    for (let reservation of reservations) {
      if (
        reservation.date === selectedDate.format("DD/MM/YYYY") &&
        reservation.roomid === room.id
      ) {
        for (let timeslotInfo of reservation.spec) {
          const { time: timeslot, info } = timeslotInfo;

          if (timeslot === time) {
            switch (info.booking_status) {
              case "booked":
                return info.current_user_booking ? "selfreserved" : "reserved";
              case "requested":
                return "requested";
              case "signed-in":
                return info.current_user_booking ? "signedin" : "reserved";
              default:
                return reservation.permission ? "permission" : "no-permission";
            }
          }
        }
      }
    }

    return room.permission ? "permission" : "no-permission";
  };

  return (
    <div className="table-content">
      <div className="table-container">
        {/* calendar */}
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

        {/* legend */}
        <div className="legend">
          <div className="legendbox">
            <div className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: "rgb(204, 202, 200)" }}
              ></div>
              <div className="legend-text">Reserved By Others</div>
            </div>
            <div className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: "rgb(245, 238, 175)" }}
              ></div>
              <div className="legend-text">Self-Reserved</div>
            </div>
            <div className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: "rgb(230, 212, 231)" }}
              ></div>
              <div className="legend-text">Booking Request Required</div>
            </div>

            <div className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: "rgb(203, 237, 205)" }}
              ></div>
              <div className="legend-text">Requested</div>
            </div>

            <div className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: "rgb(200, 232, 249)" }}
              ></div>
              <div className="legend-text">Signed-In</div>
            </div>
          </div>
        </div>

        {/* table */}
        <div className="table-wrapper">
          <table id="mytable" className="mytable">
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
              {data && data.length > 0 ? (
                data.map((room) => {
                  const roomData = data.find((d) => d.name === room.name);
                  return (
                    <tr key={room.id}>
                      <td
                        className="room-column"
                        onMouseEnter={() => setHoveredRoom(roomData)}
                        onMouseLeave={() => setHoveredRoom(null)}
                        onClick={() => {
                          navigate("/room/" + room.id);
                        }}
                      >
                        {room.name}
                        {hoveredRoom && hoveredRoom.name === room.name && (
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
                          if (pastTimes) {
                            isPast = pastTimes.includes(time);
                          }

                          return (
                            <td
                              key={time}
                              className={`time-column ${getClassName(
                                time,
                                room,
                                isPast
                              )}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                if (!isPast) {
                                  clickHandler(room.name, time, event, room.id);
                                }
                              }}
                            >
                              <div className="box"></div>
                            </td>
                          );
                        })
                      ) : (
                        <td colSpan={times.length}>No available times</td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={times.length}>No available data</td>
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
        close={() => setSelectWindow({ visible: false })}
        time={selectWindow.time}
        selectedDate={selectedDate}
        reservations={reservations}
        permission={selectWindow.permission}
        change={change}
        setChange={setChange}
        setErrorMessage={setErrorMessage}
      />
    </div>
  );
};

export default Table;
