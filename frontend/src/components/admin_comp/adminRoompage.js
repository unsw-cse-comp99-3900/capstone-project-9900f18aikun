import React, { useEffect, useState } from "react";
import "../roompage.css";
import AdminTable from "./adminTable";
import Comments from "../Comments"; // Import the Comments component
import {
  Spin,
  Space,
  Modal,
  Button,
  ConfigProvider,
} from "@arco-design/web-react";
import enUS from "@arco-design/web-react/es/locale/en-US";
import ErrorBox from "../errorBox";

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
  const [change, setChange] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Add isAdmin state
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          "http://3.26.67.188:5001/admin/check_admin",
          {
            method: "GET",
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          setErrorMessage("Failed to Get Admin Info");

          throw new Error("Failed to check admin status");
        }

        const result = await response.json();
        setIsAdmin(result.is_admin);
      } catch (error) {
        setErrorMessage("Failed to Get Admin Info");
        setError(error);
      }
    };

    checkAdminStatus();
  }, []);

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
          setErrorMessage("Failed to Fetch Booking Data");

          throw new Error("Failed to fetch booking data");
        }

        const bookingData = await response.json();
        const dataArray = Object.values(bookingData);
        setData(dataArray);
      } catch (error) {
        setErrorMessage("Failed to Fetch Booking Data");
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
          setErrorMessage("Failed to Fetch Room Info");
          throw new Error("Server responded with an error: " + errorText);
        }
        const result = await response.json();
        setRoom(result.message);
        setEditedRoom(result.message);
      } catch (error) {
        setErrorMessage("Failed to Fetch Room Info");
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

  useEffect(() => {
    if (errorMessage) {
      Notification.info({
        title: "Error",
        content: errorMessage,
        duration: 0, // 0 means the notification will not auto close
        onClose: () => setErrorMessage(""),
      });
    }
  }, [errorMessage]);

  const handleEditClick = () => {
    setIsEditing(true); // 修改 handleEditClick 函数
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
    // setIsEditing(false);
    // console.log(editedRoom.roomdetial);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/booking/edit-room`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          room_id: roomid,
          name: editedRoom.room_detail.name,
          building: editedRoom.room_detail.building,
          capacity: editedRoom.room_detail.capacity,
          level: editedRoom.room_detail.level,
        }),
      });

      if (!response.ok) {
        setErrorMessage("Failed to Update Room Data"); // 修改错误信息
        throw new Error("Failed to update room data");
      } else {
        setErrorMessage("Successfully Updated");
        setChange(!change);
      }

      const updatedRoom = await response.json();
      setRoom(updatedRoom.message);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating room data:", error);
      setError(error);
    }
  };

  if (loadingRoom || loadingData) {
    return (
      <div className="loading-container">
        <Space size={40}>
          <Spin size={40} />
        </Space>
      </div>
    );
  }

  if (!room) {
    return <div>Loading room data...</div>;
  }

  return (
    <div className="main-content">
      <div className="roompage-content">
        <div className="room-card">
          <div className="room-details">
            <div className="room-title">
              <h1>{room.room_detail.name}</h1>
            </div>
            <div className="subtitle-button">
              <span className="room-subtitle">
                ({room.room_detail.building}: Level {room.room_detail.level})
                Max. capacity: {room.room_detail.capacity}
              </span>
            </div>
            <div className="room-image">
              <img src={room.room_detail.image_url} alt="Room" />
            </div>
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
          </div>
          <div className="edit-div">
            <Button
              type="primary"
              className="edit-button"
              onClick={handleEditClick}
            >
              <img src="/admin_img/edit.png" alt="Edit" className="icon" />
              Edit
            </Button>
          </div>
        </div>

        {roomData && (
          <AdminTable
            data={roomData}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            map={false}
            change={change}
            setChange={setChange}
            setErrorMessage={setErrorMessage}
          />
        )}

        <Comments roomid={roomid} currentUserId={null} isAdmin={isAdmin} />
        <div>
          {/* {errorMessage && (
          <ErrorBox
            message={errorMessage}
            onClose={() => setErrorMessage("")}
          />
        )} */}
        </div>
        <ConfigProvider locale={enUS}>
          <Modal
            title="Edit Room"
            visible={isEditing}
            onOk={handleSubmit}
            onCancel={() => setIsEditing(false)}
          >
            <form>
              <div className="form-group">
                <label>
                  Name:
                  <input
                    type="text"
                    name="name"
                    value={editedRoom.room_detail.name}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </label>
              </div>
              <div className="form-group">
                <label>
                  Building:
                  <input
                    type="text"
                    name="building"
                    value={editedRoom.room_detail.building}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </label>
              </div>
              <div className="form-group">
                <label>
                  Level:
                  <input
                    type="text"
                    name="level"
                    value={editedRoom.room_detail.level}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </label>
              </div>
              <div className="form-group">
                <label>
                  Capacity:
                  <input
                    type="text"
                    name="capacity"
                    value={editedRoom.room_detail.capacity}
                    onChange={handleInputChange}
                    className="form-control"
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
            </form>
          </Modal>
        </ConfigProvider>
      </div>
    </div>
  );
};

export default RoomCard;
