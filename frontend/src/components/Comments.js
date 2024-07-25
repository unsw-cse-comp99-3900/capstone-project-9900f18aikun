import React, { useState, useCallback, useEffect } from "react";
import { Comment, Avatar, Button } from "@arco-design/web-react";
import { IconHeart, IconMessage, IconHeartFill } from "@arco-design/web-react/icon";
import "./Comments.css";
import ErrorBox from "./errorBox";

const Comments = ({ roomid, currentUserId, setCurrentUserId, isAdmin}) => {
  const [comments, setComments] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [rootCommentText, setRootCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
      if (setCurrentUserId) {
        setCurrentUserId(commentsData.current_zid); // Update currentUserId
      }
      console.log("Fetched comments:", commentsData.comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  }, [roomid, setCurrentUserId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleReplyClick = (commentId) => {
    setReplyingTo(commentId);
  };

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
          comment_to_id: 0,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Server responded with an error: " + errorText);
      }

      await fetchComments();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setRootCommentText("");
    }
  };

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

      await fetchComments();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setReplyingTo(null);
      setReplyText("");
    }
  };

  const handleEditClick = (commentId, commentContent) => {
    setEditingCommentId(commentId);
    setEditingCommentText(commentContent);
  };

  const handleEditSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const url = isAdmin
        ? `http://3.26.67.188:5001/admin/edit-comment`
        : `/api/comment/edit-comment`;

      const response = await fetch(url, {
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

      await fetchComments();
      setEditingCommentId(null);
      setEditingCommentText("");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleDeleteClick = async (commentId) => {
    try {
      const token = localStorage.getItem("token");
      const url = isAdmin
        ? `http://3.26.67.188:5001/admin/delete-comment`
        : `http://3.26.67.188:5001/comment/delete-comment`;

      const response = await fetch(url, {
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

      await fetchComments();
      setErrorMessage("Comment deleted successfully.");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

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

  const colors = ['#3370ff', '#ff4d4f', '#52c41a', '#faad14', '#13c2c2', '#eb2f96'];
  const userColors = {};

  const getUserColor = (userId) => {
    if (!userColors[userId]) {
      const colorIndex = Object.keys(userColors).length % colors.length;
      userColors[userId] = colors[colorIndex];
    }
    return userColors[userId];
  };

  const renderComments = (comments, level = 0) => {
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
          (isAdmin || comment.user_id === currentUserId) && ( // Check if admin or current user
            <React.Fragment key="edit-delete">
              <span
                className="custom-comment-action"
                onClick={() => handleEditClick(comment.id, comment.content)}
              >
                Edit
              </span>
              <span
                className="custom-comment-action"
                style={{ color: isAdmin ? 'red' : 'inherit' }} // Red color for admin delete button
                onClick={() => handleDeleteClick(comment.id)}
              >
                Delete
              </span>
            </React.Fragment>
          ),
        ]}
        author={`${comment.user_name}${comment.user_id === currentUserId ? ' (ME)' : ''}`} // Add user identifier
        avatar={
          <Avatar style={{ backgroundColor: getUserColor(comment.user_id) }}>
            {comment.user_name.charAt(0).toUpperCase()}
          </Avatar>
        }
        content={
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
        {comment.child_comment && renderComments(comment.child_comment, level + 1)}
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

  return (
    <div className="comment-container">
      <h2>Comments</h2>
      {renderComments(comments)}
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
      {errorMessage && (
        <ErrorBox message={errorMessage} onClose={() => setErrorMessage("")} />
      )}
    </div>
  );
};

export default Comments;