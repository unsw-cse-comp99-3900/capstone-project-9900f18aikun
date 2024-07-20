import React, { useEffect, useState } from "react";
import "./roompage.css";
import Table from "./Table";
import { Button, Input } from "@arco-design/web-react";
import ErrorBox from "./errorBox";
import { Spin, Space } from "@arco-design/web-react";

const RoomCard = ({ selectedDate, setSelectedDate }) => {
  const url = window.location.href;
  const roomid = url.split("room/")[1];

  const [room, setRoom] = useState(null);
  const [data, setData] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [change, setChange] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportText, setReportText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleReportClick = () => {
    setIsReporting(!isReporting);
  };

  const handleSubmit = async () => {
    const obj = {
      message: reportText,
    };
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/report`, {
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
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoadingData(false);
    }
  };

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
        setErrorMessage(error.message);
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
        setErrorMessage(error.message);
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
    return (
      <div className="loading-container">
        <Space size={40}>
          <Spin size={40} />
        </Space>
      </div>
    );
  }

  return (
    <div className="content">
      {room ? (
        <div>
          <div className="room-card">
            <div className="room-details">
              <div className="room-title">
                <h1>{room.room_detail.name}</h1>
                <Button
                  type="primary"
                  status={isReporting ? "default" : "danger"}
                  className="report-button"
                  onClick={handleReportClick}
                >
                  {isReporting ? "Cancel" : "Report"}
                </Button>
              </div>
              <span className="room-subtitle">
                ({room.room_detail.building}: Level {room.room_detail.level})
                Max. capacity: {room.room_detail.capacity}
              </span>

              {isReporting && (
                <div>
                  <input
                    placeholder="Enter report details"
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                  />
                  <Button type="primary" onClick={handleSubmit}>
                    Submit
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
      ) : (
        <div>No room information</div>
      )}
      {errorMessage && (
        <ErrorBox message={errorMessage} onClose={() => setErrorMessage("")} />
      )}
    </div>
  );
};

export default RoomCard;
