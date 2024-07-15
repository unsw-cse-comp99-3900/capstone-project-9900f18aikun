import React, { useEffect, useState } from "react";
import "./roompage.css";
import Table from "./Table";

const RoomCard = ({ selectedDate, setSelectedDate }) => {
  const url = window.location.href;
  const roomid = url.split("room/")[1];

  const [room, setRoom] = useState(null);
  const [data, setData] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [change, setChange] = useState(false);

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        const token = localStorage.getItem("token");
        const formattedDate = selectedDate.format("YYYY-MM-DD");
        const response = await fetch(
          `/api/booking/meetingroom?date=${formattedDate}`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              Authorization: "Bearer " + token,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch booking data");
        }

        const bookingData = await response.json();
        const dataArray = Object.values(bookingData);
        setData(dataArray);
      } catch (error) {
        console.error("Error fetching booking data:", error);
        setError(error);
      } finally {
        setLoadingData(false);
      }
    };

    const fetchRoom = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/room/room-detail/${roomid}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: "Bearer " + token,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error("Server responded with an error: " + errorText);
        }

        const result = await response.json();
        setRoom(result.message);
      } catch (error) {
        console.error("Error fetching room data:", error);
        setError(error);
      } finally {
        setLoadingRoom(false);
      }
    };

    fetchBookingData();
    fetchRoom();
  }, [roomid, selectedDate, change]);

  useEffect(() => {
    if (room && data.length) {
      const roomData = [data.find((info) => info.id === room.room_id)];
      setRoomData(roomData);
    }
  }, [room, data]);

  if (loadingRoom || loadingData) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!room) {
    return <div>No room data available</div>;
  }

  return (
    <div className="content">
      <div className="room-card">
        <div className="room-details">
          <div className="room-title">
            <h1>{room.room_detail.name}</h1>&nbsp;&nbsp;&nbsp;
            <span className="room-subtitle">
              ({room.room_detail.building}: Level {room.room_detail.level}) Max.
              capacity: {room.room_detail.capacity}
            </span>
          </div>
          <br />
          <br />
          <br />
          <br />
          <br />
          <p>
            <strong>Type:</strong>{" "}
            {room.room_type === "room" ? "Meeting Room" : "Hot Desk"}
          </p>
          <p>
            <strong>Location:</strong> {room.room_detail.building} Level{" "}
            {room.room_detail.level}
          </p>
          <p>💡 Power available</p>
        </div>
      </div>

      {roomData && (
        <Table
          data={roomData}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          map={false}
          change={change}
          setChange={setChange}
        />
      )}
    </div>
  );
};

export default RoomCard;
