import React, { useEffect, useState, useCallback } from "react";
import "./roompage.css";
import Table from "./Table";
import {
  Button,
  Rate,
  Spin,
  Space,
  Modal,
  Notification,
  ConfigProvider,
} from "@arco-design/web-react";
import enUS from "@arco-design/web-react/es/locale/en-US";
import MakeRate from "./makerate";
import Comments from "./Comments";
import api from "../api";

const RoomCard = ({ selectedDate, setSelectedDate, isAdmin }) => {
  // get room id
  const url = window.location.href;
  const roomid = url.split("room/")[1];

  const [room, setRoom] = useState(null);
  const [data, setData] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [isReporting, setIsReporting] = useState(false);
  const [reportText, setReportText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedRoom, setEditedRoom] = useState({});
  const [change, setChange] = useState(false);
  const [isRateModalVisible, setIsRateModalVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [ratingData, setRatingData] = useState({
    is_rated: false,
    my_rate: 0,
    room_score: 0,
  });

  const handleReportClick = () => {
    setIsReportModalVisible(true);
  };

  // submit report
  const handleSubmit = async () => {
    const obj = {
      message: reportText,
    };
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(api + `/admin/report`, {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(obj),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Server responded with an error: " + errorText);
      } else {
        setIsReporting(false);
        setReportText("");
        setIsReportModalVisible(false); // 关闭 Modal

        Notification.success({
          title: "Success",
          content: "You have successfully reported.",
        });
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoadingData(false);
    }
  };

  // fetch comments
  const fetchComments = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        api + `/comment/get-comment?room_id=${roomid}`,

        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 204) {
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      const commentsData = await response.json();
      setCurrentUserId(commentsData.current_zid); // 获取当前用户ID
    } catch (error) {
      setErrorMessage(error.message);
    }
  }, [roomid]);

  // fetch rating data
  const fetchRatingData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        api + `/comment/get-rate?room_id=${roomid}`,

        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: "Bearer " + token,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch rating data");
      }

      const ratingData = await response.json();
      setRatingData(ratingData);
    } catch (error) {
      console.error("Error fetching rating data:", error);
      setErrorMessage(error.message);
    }
  }, [roomid]);

  // get booking info for timetable
  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        const token = localStorage.getItem("token");
        const formattedDate = selectedDate.format("YYYY-MM-DD");
        const response = await fetch(
          api + `/booking/meetingroom?date=${formattedDate}`,
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
      } finally {
        setLoadingData(false);
      }
    };

    const fetchRoom = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(api + `/room/room-detail/${roomid}`, {
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
      } finally {
        setLoadingRoom(false);
      }
    };

    fetchRatingData();
    fetchComments();
    fetchBookingData();
    fetchRoom();
  }, [roomid, selectedDate, change, fetchComments, fetchRatingData]);

  // find info for this room
  useEffect(() => {
    if (room && data.length) {
      const roomData = [data.find((info) => info.id === room.room_id)];
      setRoomData(roomData);
    }
  }, [room, data]);

  // error handle
  useEffect(() => {
    if (errorMessage) {
      Notification.info({
        title: "Notification",
        content: errorMessage,
        duration: 0,
        onClose: () => setErrorMessage(""),
      });
    }
  }, [errorMessage]);

  // functions for edit handling
  const handleEditClick = () => {
    setIsEditing(true);
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

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(api + `/booking/edit-room`, {
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
        setErrorMessage("Failed to Update Room Data");
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
    }
  };

  // loading
  if (loadingRoom || loadingData) {
    return (
      <div className="loading-container">
        <Space size={40}>
          <Spin size={40} />
        </Space>
      </div>
    );
  }

  return (
    <div className="main-content">
      {room ? (
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
              {/*  rating component */}
              {isAdmin ? null : (
                <div className="room-rating">
                  <Rate
                    readonly
                    allowHalf
                    value={ratingData.is_rated ? ratingData.room_score : 0}
                  />
                  <span className="rate-span">
                    {ratingData.is_rated
                      ? ratingData.room_score.toFixed(1)
                      : "Nobody rated before"}
                  </span>
                  <Button
                    className="make-rate-button"
                    type="primary"
                    onClick={() => setIsRateModalVisible(true)}
                  >
                    Make Rate
                  </Button>
                </div>
              )}
              <div className="room-image">
                <img src={room.room_detail.image_url} alt="Room" />
              </div>
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
            {isAdmin ? (
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
            ) : (
              <>
                {/* Add MakeRate modal here */}
                <MakeRate
                  visible={isRateModalVisible}
                  onClose={() => setIsRateModalVisible(false)}
                  roomid={roomid}
                  myRate={ratingData.my_rate}
                  fetchRatingData={fetchRatingData} // Pass fetchRatingData to MakeRate
                />
                <div className="report-div">
                  <Button
                    type="primary"
                    status={isReporting ? "default" : "danger"}
                    className="report-button"
                    onClick={handleReportClick}
                  >
                    <img
                      src="/img/Setting.png"
                      alt="Setting"
                      className="icon"
                    />
                    {isReporting ? "Cancel" : "Report"}
                  </Button>
                </div>
              </>
            )}
          </div>
          {/* timetable */}
          {roomData && (
            <Table
              data={roomData}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              map={false}
              change={change}
              setChange={setChange}
              setErrorMessage={setErrorMessage}
              isAdmin={isAdmin}
              isSingle={true}
            />
          )}

          {/* Add a comment section below the table */}
          <Comments
            roomid={roomid}
            currentUserId={isAdmin ? null : currentUserId}
            setCurrentUserId={!isAdmin ? setCurrentUserId : null}
            isAdmin={isAdmin}
          />
        </div>
      ) : (
        <div>No room information</div>
      )}
      <ConfigProvider locale={enUS}>
        {!isAdmin ? (
          <Modal
            title="Report"
            visible={isReportModalVisible}
            onOk={handleSubmit}
            onCancel={() => setIsReportModalVisible(false)}
          >
            <textarea
              placeholder="Enter report details"
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              style={{
                width: "450px",
                height: "100px",
                padding: "10px",
                fontSize: "14px",
              }}
            />
          </Modal>
        ) : (
          <Modal
            title="Edit Room"
            visible={isEditing}
            onOk={handleEditSubmit}
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
        )}
      </ConfigProvider>
    </div>
  );
};

export default RoomCard;
