import React, { useEffect, useState } from "react";
import "../roompage.css";
import Table from "../Table";

const RoomCard = ({ selectedDate, setSelectedDate }) => {
  const url = window.location.href;
  const roomid = url.split("room/admin/")[1];

  const [room, setRoom] = useState(null);
  const [data, setData] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRoom, setEditedRoom] = useState({});

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
        setEditedRoom(result.message);
      } catch (error) {
        console.error("Error fetching room data:", error);
        setError(error);
      } finally {
        setLoadingRoom(false);
      }
    };

    fetchBookingData();
    fetchRoom();
  }, [roomid, selectedDate]);

  useEffect(() => {
    if (room && data.length) {
      const roomData = [data.find((info) => info.id === room.room_id)];
      setRoomData(roomData);
    }
  }, [room, data]);

  const handleEditClick = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditedRoom((prevState) => ({
      ...prevState,
      room_detail: {
        ...prevState.room_detail,
        [name]: value,
      },
    }));
  };

  const handleTypeChange = (event) => {
    const { value } = event.target;
    setEditedRoom((prevState) => ({
      ...prevState,
      room_type: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsEditing(false);
    // try {
    //   const token = localStorage.getItem("token");
    //   const response = await fetch(`/api/room/update/${roomid}`, {
    //     method: "PUT",
    //     headers: {
    //       "Content-Type": "application/json",
    //       Authorization: "Bearer " + token,
    //     },
    //     body: JSON.stringify(editedRoom),
    //   });

    //   if (!response.ok) {
    //     throw new Error("Failed to update room data");
    //   }

    //   const updatedRoom = await response.json();
    //   setRoom(updatedRoom.message);
    //   setIsEditing(false);
    // } catch (error) {
    //   console.error("Error updating room data:", error);
    //   setError(error);
    // }
  };

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
            <button onClick={handleEditClick} className="edit-button">
              {isEditing ? "Cancel" : "Edit"}
            </button>
          </div>
          <br />
          <br />
          <br />
          <br />
          <br />
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div>
                <label>
                  Name:
                  <input
                    type="text"
                    name="name"
                    value={editedRoom.room_detail.name}
                    onChange={handleInputChange}
                  />
                </label>
              </div>
              <div>
                <label>
                  Building:
                  <input
                    type="text"
                    name="building"
                    value={editedRoom.room_detail.building}
                    onChange={handleInputChange}
                  />
                </label>
              </div>
              <div>
                <label>
                  Level:
                  <input
                    type="text"
                    name="level"
                    value={editedRoom.room_detail.level}
                    onChange={handleInputChange}
                  />
                </label>
              </div>
              <div>
                <label>
                  Capacity:
                  <input
                    type="text"
                    name="capacity"
                    value={editedRoom.room_detail.capacity}
                    onChange={handleInputChange}
                  />
                </label>
              </div>
              <div>
                <label>
                  Type:
                  <select
                    value={editedRoom.room_type}
                    onChange={handleTypeChange}
                  >
                    <option value="room">Meeting Room</option>
                    <option value="desk">Hot Desk</option>
                  </select>
                </label>
              </div>
              <button type="submit">Save</button>
            </form>
          ) : (
            <>
              <p>
                <strong>Type:</strong>{" "}
                {room.room_type === "room" ? "Meeting Room" : "Hot Desk"}
              </p>
              <p>
                <strong>Location:</strong> {room.room_detail.building} Level{" "}
                {room.room_detail.level}
              </p>
              <p>💡 Power available</p>
            </>
          )}
        </div>
      </div>

      {roomData && (
        <Table
          data={roomData}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          map={false}
        />
      )}
    </div>
  );
};

export default RoomCard;
