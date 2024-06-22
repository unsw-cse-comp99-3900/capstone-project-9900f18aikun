import React, { useEffect, useState } from 'react';
// import ReactDOM from 'react-dom';
// import { createRoot } from 'react-dom/client';
import './Table.css';
import axios from 'axios'
import { Button } from '@mui/material';
// backup classroom, update when backend connected
const classroom = ['301 A', '301 B', '301 C', '302', '303'];

let selfReservation = [
  { room: '303', time: ['02:00 PM, 06/22/2024'] },
];

// const times = [
//   '12:00 am', '1:00 am', '2:00 am', '3:00 am', '4:00 am', '5:00 am', '6:00 am', '7:00 am',
//   '8:00 am', '9:00 am', '10:00 am', '11:00 am', '12:00 pm', '1:00 pm', '2:00 pm', '3:00 pm',
//   '4:00 pm', '5:00 pm', '6:00 pm', '7:00 pm', '8:00 pm', '9:00 pm', '10:00 pm', '11:00 pm'
// ];


// get sydney time
const getSydneyTime = async () => {
  try {
    const response = await axios.get('http://worldtimeapi.org/api/timezone/Australia/Sydney');
    const datetime = new Date(response.data.datetime);
    return datetime;
  } catch (error) {
    console.error('Error fetching Sydney time:', error);
    return new Date(); // Fallback to local time in case of error
  }
};
// function to get time
const getTime = async () => {
  const times = [];
  const cur = await getSydneyTime();
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
    times.push(cur.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
    cur.setMinutes(cur.getMinutes() + 30);
    if (cur.getHours() === 0) {
      break;
    }
  }

  return times;
}

const SelectWindow = ({ visible, time, room, position, close, self }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  if (!visible) return null;

  const style = {
    top: position.top,
    left: position.left
  };

  const gettimeList = (time, idx) => {
    const times = [];
    const [hour, minute, period] = time.match(/(\d+):(\d+) (AM|PM)/).slice(1);
    const baseTime = new Date();
    baseTime.setHours(hour % 12 + (period === 'PM' ? 12 : 0), minute, 0, 0);
    // baseTime.setHours(hour % 12 + (period === 'PM' ? 12 : 0), minute, 0, 0);

    for (let i = 1; i <= idx; i++) {
      baseTime.setMinutes(baseTime.getMinutes() + 30);
      times.push(baseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
    }

    return times;
  };

  const dropdownTime = gettimeList(time, 8);

  const confirmHandler = () => {
    const newTimes = gettimeList(time, selectedIdx);
    newTimes.push(time);
    const existing = self.find(reservation => reservation.room === room);
    if (existing) {
      existing.time.push(...newTimes)
    } else {
      self.push({room, time: newTimes})
    }
    console.log(newTimes);
    console.log(self);
    close();
  };

  return (
    <div className="select-window" style={style}>
      <div>
      <strong>{room}</strong>: {time} until...
      <select id="dropdown" onChange={(e) => setSelectedIdx(e.target.selectedIndex)}>
          {dropdownTime.map((time, idx) => (
            <option key={idx} value={idx}>{time}</option>
          ))}
        </select>
      </div>
      <br />
      <div className="button-class">
        <Button onClick={confirmHandler}>Confirm</Button>
        <Button onClick={close}>Close</Button>
      </div>
      
    </div>
  );
}

let reservations = [
  { room: '302', time: ['02:00 PM', '03:00 PM'] },
];

const Table = () => {
  const [times, setTimes] = useState([]);
  const [selectWindow, setSelectWindow] = useState({ visible: false, time: '10:00 AM', room: '302', position: { top: 0, left: 0 }, self: selfReservation });

  useEffect(() => {
    const fetchTimes = async () => {
      const newTimes = await getTime();
      setTimes(newTimes);
    };

    fetchTimes();

    const timer = setInterval(async () => {
      const newTimes = await getTime();
      setTimes(newTimes);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const clickHandler = (room, time, event) => {
    console.log(`Room: ${room}, Time: ${time}`);
    const position = { top: event.clientY + 10, left: event.clientX + 10 };
    setSelectWindow({ visible: true, room, time, position, self: selfReservation });
  };

  const hideSelectWindow = () => {
    setSelectWindow({ ...selectWindow, visible: false });
  };

  return (
    <div className="table-container">
      <div className="table-wrapper">
        <table id="mytable">
          <thead>
            <tr>
              <th>Select Space</th>
              {times.map(time => (
                <th key={time} className="time-column">{time}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* map room to time */}
            {classroom.map(room => (
              <tr key={room}>
                <td className="room-column">{room}</td>
                {times.map(time => {
                  const isReserved = reservations.some(
                    reservation => reservation.room === room && reservation.time.includes(time)
                  );
                  const isSelfReserved = selfReservation.some(
                    reservation => reservation.room === room && reservation.time.includes(time)
                  );
                  return (
                    <td key={time}
                    className={`time-column ${isReserved ? 'reserved' : (isSelfReserved ? 'selfreserved' : '')}`}
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
      <SelectWindow visible={selectWindow.visible} room={selectWindow.room} position={selectWindow.position} close={hideSelectWindow} time={selectWindow.time} self={selfReservation} />
    </div>
  );
};
// const rootElement = document.getElementById('root');
// ReactDOM.render(<App />, rootElement);
// const rootElement = document.getElementById('root');
// const root = createRoot(rootElement); // createRoot(container!) if you use TypeScript
// root.render(<App />);

export default Table;
