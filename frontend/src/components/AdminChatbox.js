import React, { useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import "./AdminChatbox.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Badge } from "@arco-design/web-react";
import api from "../api";
import socketURL from "../socket";

const AdminChatbox = ({ onClose, onToggle }) => {
  const [message, setMessage] = useState("");
  const [messageHistories, setMessageHistories] = useState({});
  const [activeUsers, setActiveUsers] = useState(new Map());
  const [selectedUser, setSelectedUser] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [adminId, setAdminId] = useState(null);
  const [newMessageUsers, setNewMessageUsers] = useState(new Set());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const pendingMessages = useRef(new Set());
  const [usageReport, setUsageReport] = useState("");
  const [messageCount, setMessageCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const connectSocket = () => {
    const token = localStorage.getItem("token");
    // const socketURL = "ws://3.26.67.188:5001";
    // const socketURL = "ws://0.0.0.0:5001";

    console.log("Attempting to connect to:", socketURL);
    console.log("Token:", token);

    socketRef.current = io(socketURL, {
      query: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current.on("connect", () => {
      console.log("Admin Socket Connected");
      console.log("Socket id:", socketRef.current.id);
      setConnectionStatus("connected");

      socketRef.current.emit("test_connection", {
        message: "Hello from admin",
      });
      socketRef.current.emit("get_admin_chat_history");
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Connection Error:", error);
      setConnectionStatus("error");
    });

    socketRef.current.on("message", (data) => {
      console.log("Raw data received:", data);
      if (data.message) {
        const { message_id, user_name, user_id, message, timestamp, chat_id } =
          data.message;
        const isAdminMessage = user_id !== chat_id;

        if (isAdminMessage && !adminId) {
          setAdminId(user_id);
        }

        const newMessage = {
          id: message_id,
          text: message,
          sender: isAdminMessage ? "admin" : "user",
          timestamp: new Date(timestamp),
          userId: user_id,
          chatId: chat_id,
          isViewed: false,
        };

        setMessageHistories((prev) => {
          const updatedMessages = [...(prev[chat_id] || [])];
          if (!pendingMessages.current.has(message_id)) {
            updatedMessages.push(newMessage);
            updatedMessages.sort((a, b) => a.timestamp - b.timestamp);
          }
          return {
            ...prev,
            [chat_id]: updatedMessages,
          };
        });

        setActiveUsers((prev) => {
          const newMap = new Map(prev);
          const existingUser = newMap.get(chat_id);
          newMap.set(chat_id, {
            ...existingUser,
            userName: existingUser ? existingUser.userName : user_name,
            chatId: chat_id,
            lastMessageTime: timestamp,
          });
          return newMap;
        });

        if (!isAdminMessage) {
          setNewMessageUsers((prev) => new Set(prev).add(chat_id));
          setMessageCount((prevCount) => prevCount + 1);
        }

        pendingMessages.current.delete(message_id);
      } else {
        console.warn("Received data in unexpected format:", data);
      }
    });

    socketRef.current.on("admin_chat_history", (data) => {
      console.log("Received admin chat history:", data);
      const newMessageHistories = {};
      const newActiveUsers = new Map();

      if (data && data.chat && Array.isArray(data.chat)) {
        data.chat.forEach((chat) => {
          const chatId = chat.chat_id;
          newActiveUsers.set(chatId, {
            userName: chat.name || "Unknown",
            chatId: chatId,
            lastMessageTime: chat.last_message_time,
            isHandled: chat.is_handled,
            isViewed: chat.is_viewed,
          });

          const messages = Array.isArray(chat.messages)
            ? chat.messages
                .map((msg) => {
                  const isAdminMessage = msg.user_id !== chatId;
                  if (isAdminMessage && !adminId) {
                    setAdminId(msg.user_id);
                  }
                  return {
                    id: msg.message_id,
                    text: msg.message,
                    sender: isAdminMessage ? "admin" : "user",
                    timestamp: new Date(msg.timestamp),
                    userId: msg.user_id,
                    chatId: chatId,
                  };
                })
                .sort((a, b) => a.timestamp - b.timestamp)
            : [];

          newMessageHistories[chatId] = messages;
        });
      } else {
        console.error(
          "Unexpected data structure for admin_chat_history:",
          data
        );
      }

      setMessageHistories(newMessageHistories);
      setActiveUsers(newActiveUsers);
      setSelectedUser(
        (prevSelected) =>
          prevSelected ||
          (newActiveUsers.size > 0 ? newActiveUsers.keys().next().value : null)
      );
    });

    socketRef.current.on("error", (error) => {
      console.error("Socket error:", error);
      setConnectionStatus("error");
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("Disconnected:", reason);
      setConnectionStatus("disconnected");
      if (reason === "io server disconnect") {
        socketRef.current.connect();
      }
    });

    socketRef.current.on("reconnect_attempt", (attemptNumber) => {
      console.log("Attempting reconnection:", attemptNumber);
      setConnectionStatus("reconnecting");
    });

    socketRef.current.on("reconnect", (attemptNumber) => {
      console.log("Reconnected after", attemptNumber, "attempts");
      setConnectionStatus("connected");
    });

    socketRef.current.on("reconnect_failed", () => {
      console.log("Failed to reconnect");
      setConnectionStatus("failed");
    });

    socketRef.current.onAny((eventName, ...args) => {
      console.log(`Received event: ${eventName}`, args);
    });
  };

  useEffect(() => {
    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    // Remove the line that resets the message count
    onToggle(!isOpen);
  };
  const fetchUsageReport = async (date) => {
    const formattedDate = date.toISOString().split("T")[0];
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        api + `/admin/get-usage-report-txt?date=${formattedDate}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch usage report");
      }

      const data = await response.json();

      // Add the usage report as a special message
      const reportMessage = {
        id: `report-${Date.now()}`,
        text: data.msg,
        sender: "system",
        timestamp: new Date(),
        isUsageReport: true,
        reportDate: formattedDate,
      };

      setMessageHistories((prev) => ({
        ...prev,
        [selectedUser]: [...(prev[selectedUser] || []), reportMessage],
      }));

      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error fetching usage report:", error);
    }
  };
  const formatDateTime = (date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleSendMessage = () => {
    console.log(
      "this is what i want",
      message.trim(),
      socketRef.current,
      selectedUser,
      adminId
    );
    if (
      message.trim() === "" ||
      !socketRef.current ||
      !selectedUser
      // ||!adminId
    )
      return;

    const messageData = {
      msg: message,
      user_id: selectedUser,
    };

    console.log("Admin sending message:", messageData);

    const tempId = Date.now().toString();
    const newMessage = {
      id: tempId,
      text: message,
      sender: "admin",
      timestamp: new Date(),
      userId: adminId,
      chatId: selectedUser,
    };

    pendingMessages.current.add(tempId);

    setMessageHistories((prev) => {
      const updatedMessages = [...(prev[selectedUser] || []), newMessage].sort(
        (a, b) => a.timestamp - b.timestamp
      );
      return {
        ...prev,
        [selectedUser]: updatedMessages,
      };
    });

    const handleSendMessage = () => {
      setActiveUsers((prev) => {
        const newMap = new Map(prev);
        const currentUser = newMap.get(selectedUser);
        newMap.set(selectedUser, {
          ...currentUser,
          lastMessageTime: newMessage.timestamp, // Update this to the new message timestamp
        });
        return newMap;
      });
    };

    socketRef.current.emit("reply_message", messageData, (acknowledgement) => {
      if (acknowledgement) {
        console.log("Admin message acknowledged:", acknowledgement);
        if (acknowledgement.message_id) {
          setMessageHistories((prev) => {
            const updatedMessages = {
              ...prev,
              [selectedUser]: prev[selectedUser].map((msg) =>
                msg.id === tempId
                  ? { ...msg, id: acknowledgement.message_id }
                  : msg
              ),
            };

            // Scroll to bottom after state update
            setTimeout(() => {
              if (messagesEndRef.current) {
                const chatContent = messagesEndRef.current.parentElement;
                chatContent.scrollTop = chatContent.scrollHeight;
              }
            }, 0);

            return updatedMessages;
          });
          pendingMessages.current.delete(tempId);
          pendingMessages.current.add(acknowledgement.message_id);
        }
      } else {
        console.warn("Admin message not acknowledged");
        setMessageHistories((prev) => ({
          ...prev,
          [selectedUser]: prev[selectedUser].filter((msg) => msg.id !== tempId),
        }));
        pendingMessages.current.delete(tempId);
      }
    });

    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUser(userId);
    if (newMessageUsers.has(userId)) {
      const newMessagesCount =
        messageHistories[userId]?.filter(
          (msg) => msg.sender !== "admin" && !msg.isViewed
        ).length || 0;
      setMessageCount((prevCount) => Math.max(prevCount - newMessagesCount, 0));
      setNewMessageUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });

      // Mark all messages for this user as viewed
      setMessageHistories((prev) => ({
        ...prev,
        [userId]:
          prev[userId]?.map((msg) => ({ ...msg, isViewed: true })) || [],
      }));
    }
    // Remove any scrolling logic here
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      const chatContent = messagesEndRef.current.parentElement;
      chatContent.scrollTop = chatContent.scrollHeight;
    }
  }, [messageHistories, selectedUser]);

  return (
    <>
      <Badge count={messageCount} dot={false}>
        <button className="admin-message" onClick={handleToggle}>
          <img src="/admin_img/Message.png" alt="Message" />
        </button>
      </Badge>
      {isOpen && (
        <div className="admin-chatbox">
          <div className="chatbox-container">
            <div className="messages-list">
              {Array.from(activeUsers.entries())
                .sort(([aId, a], [bId, b]) => {
                  if (newMessageUsers.has(aId) && !newMessageUsers.has(bId))
                    return -1;
                  if (!newMessageUsers.has(aId) && newMessageUsers.has(bId))
                    return 1;
                  return (
                    new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
                  );
                })
                .map(([chatId, userInfo], index) => {
                  const latestMessage =
                    messageHistories[chatId] &&
                    messageHistories[chatId].length > 0
                      ? messageHistories[chatId][
                          messageHistories[chatId].length - 1
                        ]
                      : null;
                  const avatarColor = `hsl(${index * 137.5}, 70%, 65%)`;
                  const initials = userInfo.userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  const hasNewMessages = newMessageUsers.has(chatId);

                  return (
                    <div
                      key={chatId}
                      className={`user-item ${
                        selectedUser === chatId ? "selected" : ""
                      } ${hasNewMessages ? "new-message" : ""}`}
                      onClick={() => handleUserSelect(chatId)}
                    >
                      <div
                        className="user-avatar"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {initials}
                      </div>
                      <div className="user-item-info">
                        <div className="user-item-header">
                          <span className="user-item-name">
                            {userInfo.userName}
                            {hasNewMessages && (
                              <span className="new-message-prompt">New</span>
                            )}
                          </span>
                          <span className="user-item-time">
                            {latestMessage
                              ? formatDateTime(latestMessage.timestamp)
                              : ""}
                          </span>
                        </div>
                        <div className="user-item-last-message">
                          {latestMessage
                            ? latestMessage.sender === "admin"
                              ? `Admin (${latestMessage.userId}): ${latestMessage.text}`
                              : `${userInfo.userName}: ${latestMessage.text}`
                            : "No messages yet"}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="message-box">
              <div
                className="overlap-group"
                style={{
                  backgroundImage: `url(${process.env.PUBLIC_URL}/admin_chatbox_img/rectangle-7.png)`,
                }}
              >
                <div className="frame">
                  <div className="text-wrapper-2">Admin Chat</div>
                </div>
                <div
                  className="icon-minus"
                  style={{
                    backgroundImage: `url(${process.env.PUBLIC_URL}/admin_chatbox_img/ellipse-1.svg)`,
                  }}
                  onClick={handleToggle}
                >
                  <img
                    className="rectangle"
                    alt="Rectangle"
                    src={
                      process.env.PUBLIC_URL +
                      "/admin_chatbox_img/rectangle-1.svg"
                    }
                  />
                </div>
                <img
                  className="customer"
                  alt="Customer"
                  src={
                    process.env.PUBLIC_URL + "/admin_chatbox_img/customer-1.png"
                  }
                />
              </div>
              <div className="chat-content">
                <div className="messages-container">
                  {selectedUser && messageHistories[selectedUser] ? (
                    <>
                      {messageHistories[selectedUser].map((msg) => {
                        if (msg.isUsageReport) {
                          return (
                            <div key={msg.id} className="message system">
                              <div className="message-timestamp">
                                {formatDateTime(msg.timestamp)}
                              </div>
                              <div className="message-text usage-report">
                                <strong>
                                  Usage Report for {msg.reportDate}:
                                </strong>
                                <p>{msg.text}</p>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div
                              key={msg.id}
                              className={`message ${msg.sender}`}
                            >
                              <div className="message-timestamp">
                                {formatDateTime(msg.timestamp)}
                              </div>
                              <div className="message-text">
                                {msg.sender === "admin"
                                  ? `Admin (${msg.userId}): ${msg.text}`
                                  : `${activeUsers.get(msg.chatId).userName}: ${
                                      msg.text
                                    }`}
                              </div>
                            </div>
                          );
                        }
                      })}
                    </>
                  ) : (
                    <div className="no-messages">
                      Select a user to view messages
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </div>
              <div className="bottom-base">
                <div className="calendar-button-wrapper">
                  <button
                    className="calendar-button"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  >
                    <img
                      src={
                        process.env.PUBLIC_URL +
                        "/admin_chatbox_img/analysis.png"
                      }
                      alt="Calendar"
                    />
                  </button>
                  <span className="calendar-tooltip">
                    Get room usage analysis
                  </span>
                </div>
                {isCalendarOpen && (
                  <div className="calendar-wrapper">
                    <button
                      className="close-calendar"
                      onClick={() => setIsCalendarOpen(false)}
                    >
                      ×
                    </button>
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date) => {
                        setSelectedDate(date);
                        setIsCalendarOpen(false);
                        fetchUsageReport(date);
                      }}
                      inline
                    />
                  </div>
                )}
                <input
                  type="text"
                  className="message-input"
                  placeholder={`Type your message here... ${
                    selectedUser ? `(to ${selectedUser})` : "(select a user)"
                  }`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  // disabled={!selectedUser || !adminId}
                />
                <img
                  className="vector"
                  alt="Send"
                  src={process.env.PUBLIC_URL + "/admin_chatbox_img/vector.svg"}
                  onClick={handleSendMessage}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminChatbox;
