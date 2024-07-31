import React, { useState, useEffect, useRef } from "react";
import CustomerService from "./CustomerService";
import "./ChatBox.css";

const Component = ({ className }) => <div className={className}>{}</div>;

export const ChatBox = ({ change, setChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expressBookMessages, setExpressBookMessages] = useState([]);
  const [customerServiceMessages, setCustomerServiceMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [mode, setMode] = useState("ExpressBook");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookedRooms, setBookedRooms] = useState(new Set());
  const [storedQuery, setStoredQuery] = useState("");
  const messagesEndRef = useRef(null);
  const [optionSelected, setOptionSelected] = useState(false);
  const textAreaRef = useRef(null);
  const [roomType, setRoomType] = useState("hotdesk");

  useEffect(() => {
    if (isOpen) {
      const storedMessages = localStorage.getItem("expressBookMessages");
      let messages = storedMessages ? JSON.parse(storedMessages) : [];

      const initialMessage = {
        text: `Default option is hotdesk. Press "exchange.png" to switch to meeting room.`,
        sender: "bot",
        timestamp: new Date(),
        showExchangeButton: true,
      };

      // Check if the first message is already the prompt
      if (messages.length === 0 || messages[0].text !== initialMessage.text) {
        messages = [initialMessage, ...messages];
      }

      setExpressBookMessages(messages);
    }
  }, [isOpen]);
  useEffect(() => {
    localStorage.setItem(
      "expressBookMessages",
      JSON.stringify(expressBookMessages)
    );
  }, [expressBookMessages]);

  const toggleChatBox = () => {
    setIsOpen((prevState) => !prevState);
  };

  const clearChat = () => {
    if (mode === "ExpressBook") {
      setExpressBookMessages([]);
      localStorage.removeItem("expressBookMessages");
    } else {
      setCustomerServiceMessages([]);
    }
    setStoredQuery("");
    setBookedRooms(new Set());
    setSelectedRoom(null);
    setOptionSelected(false);
  };

  const toggleMode = () => {
    setMode((prevMode) =>
      prevMode === "ExpressBook" ? "CustomerService" : "ExpressBook"
    );
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const toggleRoomType = () => {
    if (mode === "ExpressBook") {
      const newRoomType = roomType === "hotdesk" ? "meeting_room" : "hotdesk";
      setRoomType(newRoomType);
      const message = {
        text: `You switched to ${
          newRoomType === "hotdesk" ? "hotdesk" : "meeting room"
        }!`,
        sender: "bot",
        timestamp: new Date(),
      };
      setExpressBookMessages((prev) => [...prev, message]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [expressBookMessages, customerServiceMessages]);

  const formatRoomInfo = (rooms) => {
    if (rooms.length === 0) {
      return "No rooms available for the specified time and date.";
    }

    const { date, start_time, end_time } = rooms[0];

    const roomsByLevel = rooms.reduce((acc, room) => {
      if (!acc[room.level]) {
        acc[room.level] = [];
      }
      acc[room.level].push(room);
      return acc;
    }, {});

    let formattedResponse = `Available rooms for ${date} from ${start_time} to ${end_time}:\n\n`;

    Object.entries(roomsByLevel).forEach(([level, levelRooms]) => {
      formattedResponse += `Level ${level}:\n`;

      levelRooms.forEach((room) => {
        formattedResponse += `  • ${room.name} (Capacity: ${room.capacity})\n`;
        const isBooked = bookedRooms.has(room.name);
        if (isBooked) {
          formattedResponse += `    [Booked](booked:${room.name})\n`;
        } else if (room.permission) {
          formattedResponse += `    [Select Room](select:${room.name})\n`;
        } else {
          formattedResponse += `    [Request](request:${room.name})\n`;
        }
      });

      formattedResponse += "\n";
    });

    return formattedResponse;
  };

  const handleRoomSelection = (roomName) => {
    const lastMessageWithRooms = [...expressBookMessages]
      .reverse()
      .find((msg) => msg.rooms && Array.isArray(msg.rooms));
    if (!lastMessageWithRooms) {
      console.error("No message with rooms found");
      return;
    }

    const selected = lastMessageWithRooms.rooms.find(
      (room) => room.name === roomName
    );
    if (selected) {
      setSelectedRoom(selected);
      const confirmationMessage = {
        text:
          `You have selected ${roomName}. Here are the details:\n` +
          `• Room: ${selected.name}\n` +
          `• Level: ${selected.level}\n` +
          `• Capacity: ${selected.capacity}\n` +
          `• Date: ${selected.date}\n` +
          `• Time: ${selected.start_time} - ${selected.end_time}\n\n` +
          `[Book Room](book:${selected.room_id})`,
        sender: "bot",
        timestamp: new Date(),
      };
      setExpressBookMessages((prev) => [...prev, confirmationMessage]);
    } else {
      console.error(`Room ${roomName} not found`);
    }
  };

  const handleBookRoom = async () => {
    try {
      if (!selectedRoom) {
        throw new Error("No room selected");
      }

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const intRoomId = parseInt(selectedRoom.room_id, 10);
      if (isNaN(intRoomId)) {
        throw new Error("Invalid room ID");
      }

      const bookingInfo = {
        room_id: intRoomId,
        date: selectedRoom.date,
        start_time:
          selectedRoom.start_time.split(":")[0] +
          ":" +
          selectedRoom.start_time.split(":")[1],
        end_time:
          selectedRoom.end_time.split(":")[0] +
          ":" +
          selectedRoom.end_time.split(":")[1],
      };

      console.log("Booking information being sent to API:", bookingInfo);

      const response = await fetch("/api/booking/book", {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingInfo),
      });

      const data = await response.json();
      console.log("API response:", data);

      if (data.message && data.message.startsWith("Booking confirmed")) {
        const bookingConfirmation = {
          text: "Booking successful! Your room has been reserved 😀.",
          sender: "bot",
          timestamp: new Date(),
        };
        setExpressBookMessages((prev) => [...prev, bookingConfirmation]);
        setBookedRooms((prev) => new Set(prev).add(selectedRoom.name));
        setChange(!change);

        // Update the messages to change the "Book Room" button to "Booked"
        setExpressBookMessages((prev) =>
          prev.map((msg) => {
            if (
              msg.text.includes(`[Book Room](book:${selectedRoom.room_id})`)
            ) {
              return {
                ...msg,
                text: msg.text.replace(
                  `[Book Room](book:${selectedRoom.room_id})`,
                  `[Booked](booked:${selectedRoom.room_id})`
                ),
              };
            }
            return msg;
          })
        );
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (error) {
      console.error("Error booking room:", error);
      const errorMessage = {
        text: `Error: ${error.message}`,
        sender: "bot",
        timestamp: new Date(),
      };
      setExpressBookMessages((prev) => [...prev, errorMessage]);
    }
    setSelectedRoom(null);
  };

  const sendMessage = async () => {
    if (inputMessage.trim() === "") return;

    if (inputMessage.toLowerCase() === "clear") {
      clearChat();
      setInputMessage("");
      return;
    }

    const newMessage = {
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };
    setExpressBookMessages((prev) => [...prev, newMessage]);
    setStoredQuery(inputMessage);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const requestBody = {
        query: inputMessage,
        room_type: roomType,
      };

      console.log("Sending to server:", JSON.stringify(requestBody, null, 2));

      const response = await fetch("/api/booking/express-book", {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "An error occurred while processing your request"
        );
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const botResponse = formatRoomInfo(data);
        const botMessage = {
          text: botResponse,
          sender: "bot",
          timestamp: new Date(),
          rooms: data,
        };
        setExpressBookMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error("Unexpected response format from server");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        text:
          error.message === "No authentication token found"
            ? "You are not logged in. Please log in to use this feature."
            : error.message,
        sender: "bot",
        timestamp: new Date(),
      };
      setExpressBookMessages((prev) => [...prev, errorMessage]);
    }

    setInputMessage("");
  };
  useEffect(() => {
    console.log("express booking is", expressBookMessages);
    console.log("selected room is", selectedRoom);
  }, [expressBookMessages]);
  const handleRequestRoom = async (roomName) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const selectedRoom = expressBookMessages
        .flatMap((msg) => msg.rooms || [])
        .find((room) => room.name === roomName);

      if (!selectedRoom) throw new Error("Room information not found");

      const bookingInfo = {
        room_id: parseInt(selectedRoom.room_id, 10),
        date: selectedRoom.date,
        start_time:
          selectedRoom.start_time.split(":")[0] +
          ":" +
          selectedRoom.start_time.split(":")[1],
        end_time:
          selectedRoom.end_time.split(":")[0] +
          ":" +
          selectedRoom.end_time.split(":")[1],
      };

      console.log("Booking information being sent to API:", bookingInfo);

      const response = await fetch("/api/booking/book", {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingInfo),
      });

      const data = await response.json();
      console.log("API response:", data);

      if (data.message && data.message.startsWith("Booking confirmed")) {
        const bookingConfirmation = {
          text: "Your room request has been submitted. We'll notify you when it's approved.",
          sender: "bot",
          timestamp: new Date(),
        };
        setExpressBookMessages((prev) => [...prev, bookingConfirmation]);
        setChange(!change);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (error) {
      console.error("Error requesting room:", error);
      const errorMessage = {
        text: `Error: ${error.message}`,
        sender: "bot",
        timestamp: new Date(),
      };
      setExpressBookMessages((prev) => [...prev, errorMessage]);
    }
  };
  const formatDateTime = (date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <>
      {isOpen && (
        <div className="chat-box-container">
          <div className="chat-box">
            <div className="overlap-group">
              <img
                className="rectangle"
                alt="Rectangle"
                src="/chat_box/rectangle-6.svg"
              />
              {mode === "ExpressBook" ? (
                <>
                  <div className="chat-messages">
                    {expressBookMessages.map((msg, index) => (
                      <div key={index} className={`message ${msg.sender}`}>
                        <div className="message-timestamp">
                          {formatDateTime(msg.timestamp)}
                        </div>
                        <div className="message-text">
                          {msg.text.split("\n").map((line, i) => {
                            if (line.includes('"exchange.png"')) {
                              const [before, after] =
                                line.split('"exchange.png"');
                              return (
                                <p key={i}>
                                  {before}
                                  <img
                                    src="/chat_box/exchange.png"
                                    alt="Exchange"
                                    style={{
                                      width: "35px",
                                      height: "35px",
                                      verticalAlign: "middle",
                                    }}
                                  />
                                  {after}
                                </p>
                              );
                            }

                            if (line.includes("[Select Room]")) {
                              const roomName =
                                line.match(/\(select:(.*?)\)/)[1];
                              const isThisRoomBooked =
                                bookedRooms.has(roomName);
                              return (
                                <button
                                  key={i}
                                  onClick={() => handleRoomSelection(roomName)}
                                  disabled={isThisRoomBooked}
                                  style={{
                                    backgroundColor: isThisRoomBooked
                                      ? "grey"
                                      : "#4CAF50",
                                    cursor: isThisRoomBooked
                                      ? "not-allowed"
                                      : "pointer",
                                  }}
                                >
                                  {isThisRoomBooked ? "Booked" : "Select Room"}
                                </button>
                              );
                            } else if (line.includes("[Request]")) {
                              const roomName =
                                line.match(/\(request:(.*?)\)/)[1];
                              return (
                                <button
                                  key={i}
                                  onClick={() => handleRequestRoom(roomName)}
                                  style={{
                                    backgroundColor: "#FFA500",
                                    cursor: "pointer",
                                  }}
                                >
                                  Request
                                </button>
                              );
                            } else if (line.includes("[Book Room]")) {
                              const roomId = line.match(/\(book:(.*?)\)/)[1];
                              return (
                                <button
                                  key={i}
                                  onClick={handleBookRoom}
                                  style={{
                                    backgroundColor: "#4CAF50",
                                    cursor: "pointer",
                                  }}
                                >
                                  Book Room
                                </button>
                              );
                            } else if (line.includes("[Booked]")) {
                              return (
                                <button
                                  key={i}
                                  disabled
                                  style={{
                                    backgroundColor: "grey",
                                    cursor: "not-allowed",
                                  }}
                                >
                                  Booked
                                </button>
                              );
                            } else if (
                              line.includes("Press the exchange button")
                            ) {
                              return (
                                <p key={i}>
                                  {line.replace(
                                    "exchange button",
                                    "exchange button "
                                  )}
                                  <img
                                    src="/chat_box/exchange.png"
                                    alt="Exchange"
                                    style={{
                                      width: "20px",
                                      height: "20px",
                                      verticalAlign: "middle",
                                    }}
                                  />
                                </p>
                              );
                            }
                            return <p key={i}>{line}</p>;
                          })}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="chat-input">
                    <div className="exchange-button-container">
                      <img
                        src="/chat_box/exchange.png"
                        alt="Exchange"
                        className="exchange-button"
                        onClick={toggleRoomType}
                      />
                      <span className="exchange-button-hint">
                        Switch room type
                      </span>
                    </div>
                    <textarea
                      ref={textAreaRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type your message here..."
                      rows="1"
                    />
                    <div className="send-button-container">
                      <img
                        className="vector send-button"
                        alt="Send"
                        src="/chat_box/vector.svg"
                        onClick={sendMessage}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <CustomerService
                  messages={customerServiceMessages}
                  setMessages={setCustomerServiceMessages}
                  toggleMode={toggleMode}
                />
              )}
              <Component className="component-1" />
              <img
                className="rectangle-3"
                alt="Rectangle"
                src="/chat_box/rectangle-7.png"
              />
              <div className="icon-minus" onClick={toggleChatBox}>
                <img
                  src="/chat_box/ellipse-1.svg"
                  alt="Ellipse"
                  className="ellipse-image"
                />
                <img
                  className="rectangle-4"
                  alt="Rectangle"
                  src="/chat_box/rectangle-1.svg"
                />
              </div>
              <div className="chat-header-container">
                <div className="chat-header" onClick={toggleMode}>
                  <img
                    key={refreshKey}
                    className={
                      mode === "ExpressBook" ? "bot-image" : "service-image"
                    }
                    alt={mode === "ExpressBook" ? "Bot" : "Service"}
                    src={
                      mode === "ExpressBook"
                        ? "/chat_box/image-3.png"
                        : "/chat_box/service.png"
                    }
                  />
                  <span className="express-book-text">
                    {mode === "ExpressBook" ? "𝙀𝙭𝙥𝙧𝙚𝙨𝙨𝘽𝙤𝙤𝙠" : "𝘾𝙪𝙨𝙩𝙤𝙢𝙚𝙧𝙎𝙚𝙧𝙫𝙞𝙘𝙚"}
                  </span>
                </div>
                <span className="chat-header-hint">
                  {mode === "ExpressBook"
                    ? "Talk to 𝘾𝙪𝙨𝙩𝙤𝙢𝙚𝙧𝙎𝙚𝙧𝙫𝙞𝙘𝙚"
                    : "Switch to 𝙀𝙭𝙥𝙧𝙚𝙨𝙨𝘽𝙤𝙤𝙠"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="chat-toggle-container">
        <button className="chat-toggle-button" onClick={toggleChatBox}>
          <img
            src="/chat_box/image-2.png"
            alt="Chat"
            className="chat-toggle-icon"
          />
        </button>
        <span className="chat-toggle-hint">Ask for help</span>
      </div>
    </>
  );
};

export default ChatBox;
