import React, { useEffect, useState,useCallback} from "react";
import "./roompage.css";
import Table from "./Table";
import { Button, Input, Comment, Avatar, } from "@arco-design/web-react";
import { IconHeart, IconMessage, IconHeartFill } from "@arco-design/web-react/icon"; // 确保导入图标
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
  //评论state
  const [comments, setComments] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null); // 用于存储当前正在回复的评论ID
  const [replyText, setReplyText] = useState(""); // 用于存储回复内容
  const [tempComments, setTempComments] = useState([]);
  const [likedComments, setLikedComments] = useState({}); // 用于存储每个评论的点赞状态

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
      setComments(commentsData.comments);
      console.log("Fetched comments:", commentsData.comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
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


  
    fetchComments();
    fetchBookingData();
    fetchRoom();
  }, [roomid, selectedDate, change,fetchComments]);

  useEffect(() => {
    if (room && data.length) {
      const roomData = [data.find((info) => info.id === room.room_id)];
      setRoomData(roomData);
    }
  }, [room, data]);

  //添加根评论
  const handleRootCommentSubmit = async () => {
    const tempComment = {
      id: `temp-${Date.now()}`, // 临时ID
      room_id: roomid,
      content: replyText, 
      comment_to_id: 0, // 根评论
      user_name: "Current User", // 假设当前用户的名字
      user_id: "current_user_id", // 假设当前用户的ID
      like_count: 0,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      is_edited: false,
      child_comment: [],
    };
  
    // 立即将临时评论添加到评论列表中
    setComments([...comments, tempComment]);
    setReplyText("");
  
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://3.26.67.188:5001/comment/make-comment`, {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room_id: roomid,
          comment: replyText,
          comment_to_id: 0,
        }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Server responded with an error: " + errorText);
      } else {
        const result = await response.json();
        // 更新临时评论的ID为服务器返回的ID
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === tempComment.id ? { ...comment, id: result.id } : comment
          )
        );
      }
    } catch (error) {
      setErrorMessage(error.message);
      // 如果请求失败，移除临时评论
      setComments((prevComments) =>
        prevComments.filter((comment) => comment.id !== tempComment.id)
      );
    }
  };



  //添加评论回复
  const handleReplyClick = (commentId) => {
    setReplyingTo(commentId);
  };

  const handleReplySubmit = async () => {
    const tempReply = {
      id: `temp-${Date.now()}`, // 临时ID
      room_id: roomid,
      comment: replyText,
      comment_to_id: replyingTo,
      user_name: "Current User", // 假设当前用户的名字
      user_id: "current_user_id", // 假设当前用户的ID
      like_count: 0,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      is_edited: false,
      child_comment: [],
    };
  
    // 立即将临时回复添加到评论列表中
    setTempComments([...tempComments, tempReply]);
    setReplyingTo(null);
    setReplyText("");
  
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://3.26.67.188:5001/comment/make-comment`, {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room_id: roomid,
          comment: replyText,
          comment_to_id: replyingTo,
        }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Server responded with an error: " + errorText);
      } else {
        const result = await response.json();
        // 更新临时评论的ID为服务器返回的ID
        setTempComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === tempReply.id ? { ...comment, id: result.id } : comment
          )
        );
      }
    } catch (error) {
      setErrorMessage(error.message);
      // 如果请求失败，移除临时评论
      setTempComments((prevComments) =>
        prevComments.filter((comment) => comment.id !== tempReply.id)
      );
    }
  };
  
  //输入框
  const handleInputChange = (e) => {
    if (!e || !e.target) {
      console.error('Event or event target is undefined');
      return;
    }
    setReplyText(e.target.value);
  };


  //头像颜色列表
  const colors = ['#3370ff', '#ff4d4f', '#52c41a', '#faad14', '#13c2c2', '#eb2f96'];
  const userColors = {}; // 用于存储每个用户的颜色

  const getUserColor = (userId) => {
    if (!userColors[userId]) {
      const colorIndex = Object.keys(userColors).length % colors.length;
      userColors[userId] = colors[colorIndex];
    }
    return userColors[userId];
  };

  //点赞和取消点赞
  const handleLikeClick = async (commentId) => {
    const isLiked = likedComments[commentId];
    const url = isLiked
      ? 'http://3.26.67.188:5001/comment/unlike-comment'
      : 'http://3.26.67.188:5001/comment/like-comment';

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          accept: "application/json",
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment_id: commentId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Server responded with an error: " + errorText);
      }

      // Update the like count in the comments state
    setComments((prevComments) =>
      prevComments.map((comment) =>
        comment.id === commentId
          ? { ...comment, like_count: comment.like_count + (isLiked ? -1 : 1) }
          : comment
      )
    );

    // Update the likedComments state
    setLikedComments((prev) => ({
      ...prev,
      [commentId]: !isLiked,
    }));
  } catch (error) {
    setErrorMessage(error.message);
  }
};

//渲染评论区----------------------
  const renderComments = (comments, level = 0) => {
    if (level > 10) { // 递归深度限制
      console.error('Too deep recursion detected');
      return null;
    }

    return comments.map((comment) => (
      <Comment
        key={comment.id}
        actions={[
          <button
            className="custom-comment-action"
            key="heart"
            onClick={() => handleLikeClick(comment.id)}
          >
            {likedComments[comment.id] ? (
              <IconHeartFill style={{ color: '#f53f3f' }} />
            ) : (
              <IconHeart />
            )}
            {comment.like_count}
          </button>,
          <span
            className="custom-comment-action"
            key="reply"
            onClick={() => handleReplyClick(comment.id)}
          >
            <IconMessage /> Reply
          </span>,
        ]}
        author={comment.user_name}
        avatar={
          <Avatar style={{ backgroundColor: getUserColor(comment.user_id) }}>
            {comment.user_name.charAt(0).toUpperCase()}
          </Avatar>
        }
        content={<div>{comment.content}</div>}
        datetime={
          comment.is_edited
            ? `${comment.edit_date} ${comment.edit_time}`
            : `${comment.date} ${comment.time}`
        }
      >
        {comment.child_comment &&comment.child_comment.length > 0 &&
          renderComments(comment.child_comment, level + 1)}
        {replyingTo === comment.id && (
          <Comment
            align="right"
            actions={[
              <Button key="0" type="secondary" onClick={() => setReplyingTo(null)}>
                Cancel
              </Button>,
              <Button key="1" type="primary" onClick={handleReplySubmit}>
                Reply
              </Button>,
            ]}
            avatar={
              <Avatar style={{ backgroundColor: getUserColor(comment.user_id) }}>
                {comment.user_name.charAt(0).toUpperCase()}
              </Avatar>
            }
            content={
              <div>
                <input
                  type="text"
                  value={replyText}
                  onChange={handleInputChange}
                  placeholder="Here is your content."
                />
              </div>
            }
          />
        )}
        {tempComments
        .filter(tempComment => tempComment.comment_to_id === comment.id)
        .map(tempComment => (
          <Comment
            key={tempComment.id}
            actions={[
              <button
                className="custom-comment-action"
                key="heart"
                onClick={() => console.log("Like button clicked")}
              >
                <IconHeart />
                {tempComment.like_count}
              </button>,
              <span
                className="custom-comment-action"
                key="reply"
                onClick={() => handleReplyClick(tempComment.id)}
              >
                <IconMessage /> Reply
              </span>,
            ]}
            author={tempComment.user_name}
            avatar={
              <Avatar style={{ backgroundColor: getUserColor(tempComment.user_id) }}>
                {tempComment.user_name.charAt(0).toUpperCase()}
              </Avatar>
            }
            content={<div>{tempComment.comment}</div>}
            datetime={`${tempComment.date} ${tempComment.time}`}
          />
        ))}
      </Comment>
    ));
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
                    value={reportText} // 这里应该是 reportText 而不是 replyText
                    onChange={(e) => setReportText(e.target.value)} // 确保事件对象被正确传递
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

          {/* Add a comment section below the table */}
          <div className="comment-continaer">
            <h2>Comments</h2>
            {renderComments(comments)}
            <Comment
                align="right"
                actions={[
                  <Button key="0" type="secondary" onClick={() => setReplyText("")}>
                    Cancel
                  </Button>,
                  <Button key="1" type="primary" onClick={handleRootCommentSubmit}>
                    Reply
                  </Button>,
                ]}
                avatar={
                  <Avatar style={{ backgroundColor: getUserColor("current_user_id") }}>
                    {"Current User".charAt(0).toUpperCase()}
                  </Avatar>
                }
                content={
                  <div>
                    <input
                      type="text"
                      value={replyText}
                      onChange={handleInputChange}
                      placeholder="Here is your content."
                />
              </div>
            }
          />
        </div>         
          
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
