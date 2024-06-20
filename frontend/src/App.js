import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import './App.css';

// backup classroom, update when backend connected
const classroom = ['301 A', '301 B', '301 C', '302', '303']

// const times = [
//   '12:00 am', '1:00 am', '2:00 am', '3:00 am', '4:00 am', '5:00 am', '6:00 am', '7:00 am',
//   '8:00 am', '9:00 am', '10:00 am', '11:00 am', '12:00 pm', '1:00 pm', '2:00 pm', '3:00 pm',
//   '4:00 pm', '5:00 pm', '6:00 pm', '7:00 pm', '8:00 pm', '9:00 pm', '10:00 pm', '11:00 pm'
// ];

// function to get time
const getTime = () => {
  const times = [];
  const cur = new Date();
  const minutes = cur.getMinutes();

  // show whole hour before 15 or after 45, otherwise show half an hour
  if (minutes < 15) {
    cur.setMinutes(0, 0, 0)
  } else if (minutes < 45) {
    cur.setMinutes(30, 0, 0);
  } else {
    cur.setHours(cur.getHours() + 1);
    cur.setMinutes(0, 0, 0)
  }

  // timeslot next 12 hours
  for (let i=0; i<24; i++) {
    times.push(cur.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
    cur.setMinutes(cur.getMinutes() + 30);
  }

  return times;
}

const reservations = [
  { room: '302', time: '12:00 PM'},
];

const App = () => {
  const [times, setTimes] = useState(getTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimes(getTime());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="table-container">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Room/Time</th>
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
                {/* define reserved time */}
                {times.map(time=> {
                  const isReserved = reservations.some(
                    reservation => reservation.room === room && reservation.time === time
                  );
                  return (
                    <td key={time} className={`time-column ${isReserved ? 'reserved' : ''}`}></td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);

export default App;
