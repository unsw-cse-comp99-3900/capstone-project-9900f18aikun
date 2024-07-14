import React, { useState, useEffect, useRef } from "react";
import "./ChatBox.css";

const Component = ({ className }) => (
  <div className={className}>
    {}  
  </div>
);

export const ChatBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [mode, setMode] = useState('ExpressBook');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookedRoomName, setBookedRoomName] = useState(null);
  const [storedQuery, setStoredQuery] = useState("");
  const messagesEndRef = useRef(null);

  const toggleChatBox = () => {
    setIsOpen(prevState => !prevState);
    if (isOpen) {
      setMessages([]);
      setStoredQuery("");
      setBookedRoomName(null);
    }
  };

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'ExpressBook' ? 'CustomerService' : 'ExpressBook');
    setRefreshKey(prevKey => prevKey + 1);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

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
        formattedResponse += `    [Select Room](select:${room.name})\n`;
      });

      formattedResponse += '\n';
    });

    return formattedResponse;
  };

  const handleRoomSelection = (roomName) => {
    const selected = messages[messages.length - 1].rooms.find(room => room.name === roomName);
    if (selected) {
      setSelectedRoom(selected);
      const confirmationMessage = {
        text: `You have selected ${roomName}. Here are the details:\n` +
              `• Room: ${selected.name}\n` +
              `• Level: ${selected.level}\n` +
              `• Capacity: ${selected.capacity}\n` +
              `• Date: ${selected.date}\n` +
              `• Time: ${selected.start_time} - ${selected.end_time}\n\n` +
              `[Book Room](book:${selected.id})`,
        sender: "bot",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmationMessage]);
    }
  };

  const handleBookRoom = async () => {
    try {
      if (!selectedRoom) {
        throw new Error('No room selected');
      }
  
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
  
      const intRoomId = parseInt(selectedRoom.room_id, 10);
      console.log("book id", selectedRoom)
      if (isNaN(intRoomId)) {
        throw new Error('Invalid room ID');
      }
  
      const bookingInfo = {
        room_id: intRoomId,
        date: selectedRoom.date,
        start_time: selectedRoom.start_time.split(':')[0] + ':00',
        end_time: selectedRoom.end_time.split(':')[0] + ':00'
      };
  
      console.log('Booking information being sent to API:', bookingInfo);
  
      const response = await fetch('http://s2.gnip.vip:37895/booking/book', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingInfo),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`);
      }
  
      const data = await response.json();
      console.log('API response:', data);
  
      const bookingConfirmation = { 
        text: "Booking successful! Your room has been reserved.", 
        sender: "bot", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, bookingConfirmation]);
      setBookedRoomName(selectedRoom.name);
    } catch (error) {
      console.error("Error booking room:", error);
      const errorMessage = { 
        text: `Sorry, there was an error processing your booking request: ${error.message}`, 
        sender: "bot", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    setSelectedRoom(null);
  };

  const sendMessage = async () => {
    if (inputMessage.trim() === "") return;

    const newMessage = { text: inputMessage, sender: "user", timestamp: new Date() };
    setMessages([...messages, newMessage]);
    setStoredQuery(inputMessage); // Store the user's input

    const optionsMessage = {
      text: "Please select the type of space you'd like to book:",
      sender: "bot",
      timestamp: new Date(),
      options: [
        { text: "Meeting Room", id: "meeting_room" },
        { text: "Hot Desk", id: "hot_desk" }
      ]
    };
    setMessages(prev => [...prev, optionsMessage]);
    setInputMessage("");
  };

  const handleOptionSelection = async (roomType) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const requestBody = {
        query: storedQuery, // Use the stored query here
        room_type: roomType
      };

      console.log("Sending to server:", JSON.stringify(requestBody, null, 2));

      const response = await fetch('http://s2.gnip.vip:37895/booking/express-book', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let botResponse;

      if (Array.isArray(data) && data.length > 0) {
        botResponse = formatRoomInfo(data);
      } else {
        botResponse = "I'm sorry, I couldn't find any rooms matching your request.";
      }

      const botMessage = { 
        text: botResponse, 
        sender: "bot", 
        timestamp: new Date(),
        rooms: data
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = { 
        text: error.message === 'No authentication token found' 
          ? "You are not logged in. Please log in to use this feature." 
          : "Sorry, there was an error processing your request.", 
        sender: "bot", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      {isOpen && (
        <div className="chat-box-container">
          <div className="chat-box">
            <div className="overlap-group">
              <img className="rectangle" alt="Rectangle" src="/chat_box/rectangle-6.svg" />
              <div className="chat-messages">
                {messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.sender}`}>
                    <div className="message-timestamp">
                      {formatDateTime(msg.timestamp)}
                    </div>
                    <div className="message-text">
                      {msg.text.split('\n').map((line, i) => {
                        if (line.includes('[Select Room]')) {
                          const roomName = line.match(/\(select:(.*?)\)/)[1];
                          const isThisRoomBooked = roomName === bookedRoomName;
                          return (
                            <button 
                              key={i} 
                              onClick={() => handleRoomSelection(roomName)}
                              disabled={isThisRoomBooked}
                              style={{ 
                                backgroundColor: isThisRoomBooked ? 'grey' : '#4CAF50',
                                cursor: isThisRoomBooked ? 'not-allowed' : 'pointer'
                              }}
                            >
                              {isThisRoomBooked ? 'Booked' : 'Select Room'}
                            </button>
                          );
                        } else if (line.includes('[Book Room]')) {
                          return (
                            <button key={i} onClick={handleBookRoom}>
                              Book Room
                            </button>
                          );
                        }
                        return <p key={i}>{line}</p>;
                      })}
                      {msg.options && (
                        <div className="option-buttons">
                          {msg.options.map((option, i) => (
                            <button key={i} onClick={() => handleOptionSelection(option.id)}>
                              {option.text}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message here..."
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
              <Component className="component-1" />
              <img className="rectangle-3" alt="Rectangle" src="/chat_box/rectangle-7.png" />
              <div className="icon-minus" onClick={toggleChatBox}>
                <img src="/chat_box/ellipse-1.svg" alt="Ellipse" className="ellipse-image" />
                <img className="rectangle-4" alt="Rectangle" src="/chat_box/rectangle-1.svg" />
              </div>
              <div className="chat-header" onClick={toggleMode}>
                <img 
                  key={refreshKey}
                  className={mode === 'ExpressBook' ? "bot-image" : "service-image"}
                  alt={mode === 'ExpressBook' ? "Bot" : "Service"}
                  src={mode === 'ExpressBook' ? "/chat_box/image-3.png" : "/chat_box/service.png"}
                />
                <span className="express-book-text">
                  {mode === 'ExpressBook' ? '𝙀𝙭𝙥𝙧𝙚𝙨𝙨𝘽𝙤𝙤𝙠' : '𝘾𝙪𝙨𝙩𝙤𝙢𝙚𝙧𝙎𝙚𝙧𝙫𝙞𝙘𝙚'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      <button className="chat-toggle-button" onClick={toggleChatBox}>
        <img src="/chat_box/image-2.png" alt="Chat" className="chat-toggle-icon" />
      </button>
    </>
  );
};

export default ChatBox;