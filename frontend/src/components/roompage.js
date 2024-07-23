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
  const [rootCommentText, setRootCommentText] = useState("");// 用于存储根评论
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");// 用于存储编辑评论
  // 在 RoomCard 组件内部添加新的状态
  const [tempComments, setTempComments] = useState([]);


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
      setComments(commentsData.comments); // Use comments as received from backend
      setCurrentUserId(commentsData.current_zid); // 获取当前用户ID
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




  const handleReplyClick = (commentId) => {
    setReplyingTo(commentId);
  };

//--------------添加根评论
const handleRootCommentSubmit = async () => {
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
        comment: rootCommentText,
        comment_to_id: 0, // 根评论的 comment_to_id 始终为 0
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error("Server responded with an error: " + errorText);
    }

    // 重新获取评论数据
    await fetchComments();
  } catch (error) {
    setErrorMessage(error.message);
  } finally {
    // 重置根评论输入框
    setRootCommentText("");
  }
};



  //--------------添加回复评论
  const handleReplySubmit = async () => {
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
      }
  
      // 重新获取评论数据
      await fetchComments();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      // 重置回复状态
      setReplyingTo(null);
      setReplyText("");
    }
  };

  // const handleInputChange = (e) => {
  //   if (!e || !e.target) {
  //     console.error('Event or event target is undefined');
  //     return;
  //   }
  //   setReplyText(e.target.value);
  // };

  const handleEditClick = (commentId, commentContent) => {
    setEditingCommentId(commentId);
    setEditingCommentText(commentContent);
  };

  //---------------提交修改评论
  const handleEditSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/comment/edit-comment`, {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment_id: editingCommentId,
          comment: editingCommentText,
        }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Server responded with an error: " + errorText);
      }
  
      // 重新获取评论数据
      await fetchComments();
  
      // 重置编辑状态
      setEditingCommentId(null);
      setEditingCommentText("");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };


  const handleDeleteClick = async (commentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://3.26.67.188:5001/comment/delete-comment`, {
        method: "DELETE",
        headers: {
          accept: "application/json",
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment_id: commentId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete comment");
      }

      // 重新获取评论数据
      await fetchComments();

      // 显示成功消息
      setErrorMessage("Comment deleted successfully.");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

//评论点赞
const handleLikeClick = async (comment) => {
  try {
    const token = localStorage.getItem("token");
    const url = comment.current_user_liked
      ? `http://3.26.67.188:5001/comment/unlike-comment`
      : `http://3.26.67.188:5001/comment/like-comment`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        accept: "application/json",
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comment_id: comment.id,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update like status");
    }

    // 更新评论的点赞状态和数量
    const updateComments = (comments) => {
      return comments.map((c) => {
        if (c.id === comment.id) {
          return { ...c, current_user_liked: !c.current_user_liked, like_count: result.like_count };
        } else if (c.child_comment) {
          return { ...c, child_comment: updateComments(c.child_comment) };
        }
        return c;
      });
    };

    setComments((prevComments) => updateComments(prevComments));
  } catch (error) {
    setErrorMessage(error.message);
  }
};



//--------------渲染评论数据----------
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
  const renderComments = (comments, level = 0) => {
    // const allComments = [...comments, ...tempComments];
    return comments.map((comment) => (
      <Comment
        key={comment.id}
        actions={[
          <button
            className="custom-comment-action"
            key="heart"
            onClick={() => handleLikeClick(comment)}
          >
            {comment.current_user_liked ? (
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
          comment.user_id === currentUserId && (
            <React.Fragment key="edit-delete">
              <span
              className="custom-comment-action"
              onClick={() => handleEditClick(comment.id, comment.content)}
              >
                Edit
              </span>
              <span
                className="custom-comment-action"
                onClick={() => handleDeleteClick(comment.id)}
              >
                Delete
              </span>
            </React.Fragment>
          ),
        ]}
        author={comment.user_name}
        avatar={
          <Avatar style={{ backgroundColor: getUserColor(comment.user_id) }}>
            {comment.user_name.charAt(0).toUpperCase()}
          </Avatar>
        }
        content={// 修改的部分：根据 editingCommentId 的值来决定是否显示评论内容或编辑输入框
              editingCommentId === comment.id ? (
                <div>
                  <input
                    type="text"
                    value={editingCommentText}
                    onChange={(e) => setEditingCommentText(e.target.value)}
                  />
                  <Button type="primary" onClick={handleEditSubmit}>
                    Submit
                  </Button>
                  <Button type="secondary" onClick={() => setEditingCommentId(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div>{comment.content}</div>
              )
            }
        datetime={
          comment.is_edited
            ? `${comment.edit_date} ${comment.edit_time}`
            : `${comment.date} ${comment.time}`
        }
      >
        {comment.child_comment &&
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
              <Avatar style={{ backgroundColor: '#14a9f8' }}>
                Me
              </Avatar>
            }
            content={
              <div>
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => {
                    if (!e || !e.target) {
                      console.error('Event or event target is undefined');
                      return;
                    }
                    setReplyText(e.target.value);
                  }}
                  placeholder="Input your content."
                />
              </div>
            }
          />
        )}
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
          {/* Root comment input */}
          <Comment
            align="right"
            actions={[
              <Button key="0" type="secondary" onClick={() => setRootCommentText("")}>
                Cancel
              </Button>,
              <Button key="1" type="primary" onClick={handleRootCommentSubmit}>
                Comment
              </Button>,
            ]}
            avatar={
              <Avatar style={{ backgroundColor: '#14a9f8' }}>
                Me
              </Avatar>
            }
            content={
              <div>
                <input
                  type="text"
                  value={rootCommentText}
                  onChange={(e) => {
                    if (!e || !e.target) {
                      console.error('Event or event target is undefined');
                      return;
                    }
                    setRootCommentText(e.target.value);
                  }}
                  placeholder="Add a comment..."
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
