// comments component for the room detail page,can add/reply/edit/delete comment
import React, { useState, useCallback, useEffect } from 'react';
import {
  Comment,
  Avatar,
  Button,
  Popconfirm,
  Notification,
} from '@arco-design/web-react';
import {
  IconHeart,
  IconMessage,
  IconHeartFill,
} from '@arco-design/web-react/icon';
import './Comments.css';
// import ErrorBox from "./errorBox";
import api from '../api';

const Comments = ({ roomid, currentUserId, setCurrentUserId, isAdmin }) => {
  const [comments, setComments] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [rootCommentText, setRootCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch comments from the backend
  const fetchComments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        api + `/comment/get-comment?room_id=${roomid}`,

        // `http://3.26.67.188:5001/comment/get-comment?room_id=${roomid}`,
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 204) {
        setComments([]);

        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const commentsData = await response.json();
      setComments(commentsData.comments);
      if (setCurrentUserId) {
        setCurrentUserId(commentsData.current_zid); // Update currentUserId
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  }, [roomid, setCurrentUserId]);

  // Fetch comments on component mount
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Show notification if there's an error message
  useEffect(() => {
    if (errorMessage) {
      Notification.info({
        title: 'Notification',
        content: errorMessage,
        duration: 0,
        onClose: () => setErrorMessage(''),
      });
    }
  }, [errorMessage]);

  // Handle reply button click
  const handleReplyClick = (commentId) => {
    setReplyingTo(commentId);
  };

  // Handle root comment submission
  const handleRootCommentSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        api + `/comment/make-comment`,

        // `http://3.26.67.188:5001/comment/make-comment`,
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            room_id: roomid,
            comment: rootCommentText,
            comment_to_id: 0,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Server responded with an error: ' + errorText);
      }

      await fetchComments();
      Notification.success({
        title: 'Success',
        content: 'Comment success.',
      });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setRootCommentText('');
    }
  };

  // Handle reply submission
  const handleReplySubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        api + `/comment/make-comment`,

        // `http://3.26.67.188:5001/comment/make-comment`,
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            room_id: roomid,
            comment: replyText,
            comment_to_id: replyingTo,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Server responded with an error: ' + errorText);
      }

      await fetchComments();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setReplyingTo(null);
      setReplyText('');
    }
  };

  // Handle edit button click
  const handleEditClick = (commentId, commentContent) => {
    setEditingCommentId(commentId);
    setEditingCommentText(commentContent);
  };

  // Handle edit submission
  const handleEditSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = isAdmin
        ? // ? `http://3.26.67.188:5001/admin/edit-comment`
          api + `/admin/edit-comment`
        : api + `/comment/edit-comment`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: editingCommentId,
          comment: editingCommentText,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Server responded with an error: ' + errorText);
      }

      await fetchComments();
      setEditingCommentId(null);
      setEditingCommentText('');
      Notification.success({
        title: 'Success',
        content: 'Edit comment success!',
      });
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // Handle delete button click
  const handleDeleteClick = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      const url = isAdmin
        ? // ? `http://3.26.67.188:5001/admin/delete-comment`
          // : `http://3.26.67.188:5001/comment/delete-comment`;

          api + `/admin/delete-comment`
        : api + `/comment/delete-comment`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          accept: 'application/json',
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: commentId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete comment');
      }

      await fetchComments();
      Notification.success({
        title: 'Success',
        content: 'Comment deleted successfully.',
      });
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // Handle like button click
  const handleLikeClick = async (comment) => {
    try {
      const token = localStorage.getItem('token');
      const url = comment.current_user_liked
        ? // ? `http://3.26.67.188:5001/comment/unlike-comment`
          // : `http://3.26.67.188:5001/comment/like-comment`;
          api + `/comment/unlike-comment`
        : api + `/comment/like-comment`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          accept: 'application/json',
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: comment.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update like status');
      }

      const updateComments = (comments) => {
        return comments.map((c) => {
          if (c.id === comment.id) {
            return {
              ...c,
              current_user_liked: !c.current_user_liked,
              like_count: result.like_count,
            };
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

  // Colors for user avatars
  const colors = [
    '#FCE996',
    '#9FD4FD',
    '#FB9DC7',
    '#89E9E0',
    '#7BE188',
    '#FCC59F',
  ];
  const userColors = {};

  // Get color for a user
  const getUserColor = (userId) => {
    if (!userColors[userId]) {
      const colorIndex = Object.keys(userColors).length % colors.length;
      userColors[userId] = colors[colorIndex];
    }
    return userColors[userId];
  };

  // Render comments recursively
  const renderComments = (comments, level = 0) => {
    return comments.map((comment) => (
      <Comment
        key={comment.id}
        actions={[
          <button
            className="custom-comment-action"
            key="heart"
            onClick={() => handleLikeClick(comment)}
            style={{
              backgroundColor: '#E5E6EB',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
            }}
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
              <Popconfirm
                focusLock
                title="Do you want to delete the comment?"
                okText="Delete"
                cancelButtonProps={{ style: { display: 'none' } }}
                onOk={() => handleDeleteClick(comment.id)}
              >
                <span
                  className="custom-comment-action"
                  style={{ color: isAdmin ? 'red' : 'inherit' }} // Red color for admin delete button
                >
                  Delete
                </span>
              </Popconfirm>
            </React.Fragment>
          ),
        ]}
        author={`${comment.user_name}${
          comment.user_id === currentUserId ? ' (ME)' : ''
        }`} // Add user identifier
        avatar={
          <Avatar style={{ backgroundColor: getUserColor(comment.user_id) }}>
            {comment.user_name.charAt(0).toUpperCase()}
          </Avatar>
        }
        content={
          editingCommentId === comment.id ? (
            <div className="edit-comment-container">
              <input
                type="text"
                value={editingCommentText}
                onChange={(e) => setEditingCommentText(e.target.value)}
                className="edit-input"
              />
              <div className="edit-comment-actions">
                <Button
                  type="secondary"
                  onClick={() => setEditingCommentId(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={handleEditSubmit}
                  style={{ backgroundColor: '#C396ED', borderColor: '#C396ED' }}
                >
                  Submit
                </Button>
              </div>
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
              <Button
                key="0"
                type="secondary"
                onClick={() => setReplyingTo(null)}
              >
                Cancel
              </Button>,
              <Button
                key="1"
                type="primary"
                onClick={handleReplySubmit}
                style={{ backgroundColor: '#C396ED', borderColor: '#C396ED' }}
              >
                Reply
              </Button>,
            ]}
            avatar={<Avatar style={{ backgroundColor: '#14a9f8' }}>Me</Avatar>}
            content={
              <div>
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => {
                    if (!e || !e.target) {
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
      <h2 className="comment-title">Comments</h2>
      {renderComments(comments)}
      <Comment
        align="right"
        actions={[
          <Button
            key="0"
            type="secondary"
            onClick={() => setRootCommentText('')}
          >
            Cancel
          </Button>,
          <Button
            key="1"
            type="primary"
            onClick={handleRootCommentSubmit}
            style={{ backgroundColor: '#C396ED', borderColor: '#C396ED' }}
          >
            Comment
          </Button>,
        ]}
        avatar={<Avatar style={{ backgroundColor: '#14a9f8' }}>Me</Avatar>}
        content={
          <div>
            <input
              type="text"
              value={rootCommentText}
              onChange={(e) => {
                if (!e || !e.target) {
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
  );
};

export default Comments;
