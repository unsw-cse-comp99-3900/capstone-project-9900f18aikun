import React, { useEffect, useState } from "react";
import "./roompage.css";

const RoomCard = () => {
  const url = window.location.href;
  const roomid = url.split("room/")[1]
  
  console.log(url, roomid);

  const [room, setRoom] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoom = async () => {
      const token = localStorage.getItem("token");
      console.log(token)
      try {
        const response = await fetch("/api/room/room-detail/" + roomid, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: "Bearer " + token,
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log(result);
          setRoom(result);
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

    fetchRoom();
  }, []);

  return (
    <div className="room-card">
      <div className="room-info">
        <div className="room-title">
          <h1>K-G17</h1>
          <span className="room-subtitle">(K17: Level 2) Max. capacity: 5</span>
        </div>
        <div className="room-image">
          <img src="/path/to/your/image.jpg" alt="Room" />
        </div>
      </div>
      <div className="room-details">
        <p>
          <strong>Type:</strong> Meeting Room
        </p>
        <p>Round table</p>
        <p>
          <strong>Location:</strong> Computer Science building, level 2, near
          lifts
        </p>
        <p>
          <strong>Equipment:</strong> Whiteboard, LCD screen
        </p>
        <p>💡 Power available</p>
      </div>
    </div>
  );
};

export default RoomCard;
