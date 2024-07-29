import React, { useEffect, useState,useCallback} from "react";
import "./roompage.css";
import Table from "./Table";
import { Button, Rate, Spin, Space,Modal, Notification } from "@arco-design/web-react";
import ErrorBox from "./errorBox";
import MakeRate from "./makerate";
import Comments from "./Comments"; // Import the new Comments component

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

  // //评论评分state
  const [comments, setComments] = useState([]);
  // const [replyingTo, setReplyingTo] = useState(null); // 用于存储当前正在回复的评论ID
  // const [replyText, setReplyText] = useState(""); // 用于存储回复内容
  // const [rootCommentText, setRootCommentText] = useState("");// 用于存储根评论
  // const [currentUserId, setCurrentUserId] = useState(null);
  // const [editingCommentId, setEditingCommentId] = useState(null);
  // const [editingCommentText, setEditingCommentText] = useState("");// 用于存储编辑评论
  const [ratingData, setRatingData] = useState({ is_rated: false, my_rate: 0, room_score: 0 });
  const [isRateModalVisible, setIsRateModalVisible] = useState(false); // State for modal visibility
  const [currentUserId, setCurrentUserId] = useState(null); // Add currentUserId state
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
 

  const handleReportClick = () => {
    setIsReportModalVisible(true);
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
        setIsReportModalVisible(false); // 关闭 Modal
        
        Notification.success({
          title: 'Success',
          content: 'You have successfully reported.',
        });
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoadingData(false);
    }
  };


  // const handleReportClick = () => {
  //   setIsReporting(!isReporting);
  // };

  // const handleSubmit = async () => {
  //   const obj = {
  //     message: reportText,
  //   };
  //   try {
  //     const token = localStorage.getItem("token");
  //     const response = await fetch(`/api/admin/report`, {
  //       method: "POST",
  //       headers: {
  //         accept: "application/json",
  //         Authorization: "Bearer " + token,
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(obj),
  //     });

  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       throw new Error("Server responded with an error: " + errorText);
  //     } else {
  //       setIsReporting(false);
  //       setReportText("");
  //     }
  //   } catch (error) {
  //     setErrorMessage(error.message);
  //   } finally {
  //     setLoadingData(false);
  //   }
  // };





  const fetchComments = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://3.26.67.188:5001/comment/get-comment?room_id=${roomid}`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (response.status === 204) {
        setComments([]);
        console.log("No comments found for this room.");
        return;
      }
  
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
  
      const commentsData = await response.json();
      setComments(commentsData.comments); // Use comments as received from backend
      setCurrentUserId(commentsData.current_zid); // 获取当前用户ID
      console.log("Fetched comments:", commentsData.comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  }, [roomid]);

  const fetchRatingData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://3.26.67.188:5001/comment/get-rate?room_id=${roomid}`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: "Bearer " + token,
        },
      });

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




    fetchRatingData();
    fetchComments();
    fetchBookingData();
    fetchRoom();
  }, [roomid, selectedDate, change,fetchComments,fetchRatingData]);

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
                  <img src="/img/Setting.png" alt="Setting" className="icon" />
                  {isReporting ? "Cancel" : "Report"}
                </Button>
              </div>
              <span className="room-subtitle">
                ({room.room_detail.building}: Level {room.room_detail.level})
                Max. capacity: {room.room_detail.capacity}
              </span>
              {/* {isReporting && (
                <div>
                  <input
                    placeholder="Enter report details"
                    value={reportText} // 这里应该是 reportText 而不是 replyText
                    onChange={(e) => setReportText(e.target.value)} // 确保事件对象被正确传递
                  />
                  <Button type="primary" onClick={handleSubmit}>
                    Submit
                  </Button>
                </div>
              )} */}
              {/*  rating component */}
              <div className="room-rating">
                <Rate readonly allowHalf value={ratingData.is_rated ? ratingData.room_score : 0} />
                <span className="rate-span">
                  {ratingData.is_rated ? ratingData.room_score : "Nobody rated before"}
                </span>
                <Button className='make-rate-button' type="primary" onClick={() => setIsRateModalVisible(true)}>
                  Make Rate
                </Button>
              </div>

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
          {/* Add MakeRate modal here */}
          <MakeRate
            visible={isRateModalVisible}
            onClose={() => setIsRateModalVisible(false)}
            roomid={roomid}
            myRate={ratingData.my_rate}
            fetchRatingData={fetchRatingData} // Pass fetchRatingData to MakeRate
          />
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

          {/* Add a comment section below the table */}
          <Comments roomid={roomid} currentUserId={currentUserId} setCurrentUserId={setCurrentUserId} />
              
        </div>
      ) : (
        <div>No room information</div>
      )}
      {errorMessage && (
        <ErrorBox message={errorMessage} onClose={() => setErrorMessage("")} />
      )}

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
            style={{ width: '450px', height: '100px', padding: '10px', fontSize: '14px' }}
          />
        </Modal>
    </div>
  );
};

export default RoomCard;
