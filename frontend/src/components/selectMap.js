// SelectMap.js
import React, { useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import './selectMap.css';

const level = [
  { id: 1, level: 'A-K17-B' },
  { id: 2, level: 'A-K17-G' },
  { id: 3, level: 'A-K17-L1' },
  { id: 4, level: 'A-K17-L2' },
  { id: 5, level: 'A-K17-L3' },
  { id: 6, level: 'A-K17-L4' },
  { id: 7, level: 'A-K17-L5' },
  { id: 8, level: 'A-K17-L6' },
  { id: 9, level: 'A-J17-L5' },
];

// 配置每张地图的遮罩区域和对应的跳转路径
const mapOverlays = {
  'A-K17-B': [
    { id: 1, top: '50%', left: '25%', width: '20%', height: '20%', roomId: 1,type: 'meetingroom' },
    { id: 2, top: '70%', left: '55%', width: '20%', height: '20%', roomId: 2 ,type: 'meetingroom'},
    
  ],
  'A-K17-G': [
    { id: 3, top: '29%', left: '51%', width: '40px', height: '40px', roomId: 3,type: 'meetingroom' },
    { id: 4, top: '29%', left: '58%', width: '40px', height: '40px', roomId: 4,type: 'meetingroom' },
    
  ],
  'A-K17-L1': [
    { id: 5, top: '15%', left: '68%', width: '46px', height: '90px', roomId: 5,type: 'meetingroom' },
    { id: 6, top: '47%', left: '8%', width: '165px', height: '95px', roomId: 6 ,type: 'meetingroom'},
    
  ],
  'A-K17-L2': [
    { id: 7, top: '47%', left: '33%', width: '130px', height: '78px', roomId: 7,type: 'meetingroom'},
    { id: 8, top: '82.5%', left: '51%', width: '15px', height: '15px', roomId: 15,type: 'desk' },
    { id: 9, top: '85.5%', left: '51%', width: '15px', height: '15px', roomId: 16,type: 'desk' },
    { id: 10, top: '89.5%', left: '51%', width: '15px', height: '15px', roomId: 17,type: 'desk' },
    { id: 11, top: '89.5%', left: '56%', width: '12px', height: '12px', roomId: 18,type: 'desk' },
    { id: 12, top: '86%', left: '56%', width: '12px', height: '12px', roomId: 19,type: 'desk' },
    { id: 13, top: '83%', left: '56%', width: '12px', height: '12px', roomId: 20,type: 'desk' },
    { id: 14, top: '89.5%', left: '58%', width: '12px', height: '12px', roomId: 21,type: 'desk' },
    { id: 15, top: '86%', left: '58%', width: '12px', height: '12px', roomId: 22,type: 'desk' },
    { id: 16, top: '83%', left: '58%', width: '12px', height: '12px', roomId: 23,type: 'desk' },
    { id: 17, top: '89.5%', left: '67%', width: '12px', height: '12px', roomId: 24,type: 'desk' },
    { id: 18, top: '86%', left: '67%', width: '12px', height: '12px', roomId: 25,type: 'desk' },
    { id: 19, top: '83%', left: '67%', width: '12px', height: '12px', roomId: 26,type: 'desk' },
    { id: 20, top: '89.5%', left: '69.5%', width: '12px', height: '12px', roomId: 29,type: 'desk' },
    { id: 21, top: '86%', left: '69.5%', width: '12px', height: '12px', roomId: 28,type: 'desk' },
    { id: 22, top: '83%', left: '69.5%', width: '12px', height: '12px', roomId: 27,type: 'desk' },
    { id: 23, top: '89.5%', left: '73%', width: '12px', height: '12px', roomId: 32,type: 'desk' },
    { id: 24, top: '86%', left: '73%', width: '12px', height: '12px', roomId: 31,type: 'desk' },
    { id: 25, top: '83%', left: '73%', width: '12px', height: '12px', roomId: 30,type: 'desk' },
    { id: 26, top: '38.5%', left: '25%', width: '12px', height: '12px', roomId: 33,type: 'desk' },
    { id: 27, top: '38.5%', left: '20%', width: '12px', height: '12px', roomId: 34,type: 'desk' },
    { id: 28, top: '38.5%', left: '16%', width: '12px', height: '12px', roomId: 35,type: 'desk' },
    { id: 29, top: '38.5%', left: '12%', width: '12px', height: '12px', roomId: 36,type: 'desk' },
    { id: 30, top: '35.5%', left: '12%', width: '12px', height: '12px', roomId: 37,type: 'desk' },
    { id: 31, top: '35.5%', left: '16%', width: '12px', height: '12px', roomId: 38,type: 'desk' },
    { id: 32, top: '35.5%', left: '20%', width: '12px', height: '12px', roomId: 39,type: 'desk' },
    { id: 33, top: '35.5%', left: '25%', width: '12px', height: '12px', roomId: 40,type: 'desk' },
    { id: 34, top: '32%', left: '25%', width: '12px', height: '12px', roomId: 41,type: 'desk' },
    { id: 35, top: '32%', left: '31%', width: '12px', height: '12px', roomId: 42,type: 'desk' },
    { id: 36, top: '31%', left: '37%', width: '12px', height: '12px', roomId: 43,type: 'desk' },
    { id: 37, top: '29%', left: '43%', width: '12px', height: '12px', roomId: 44,type: 'desk' },
    { id: 38, top: '44.5%', left: '12%', width: '12px', height: '12px', roomId: 45,type: 'desk' },
    { id: 39, top: '44.5%', left: '18%', width: '12px', height: '12px', roomId: 46,type: 'desk' },
    { id: 40, top: '60.5%', left: '21.5%', width: '12px', height: '12px', roomId: 47,type: 'desk' },
    { id: 41, top: '60.5%', left: '26.5%', width: '12px', height: '12px', roomId: 48,type: 'desk' },
    { id: 42, top: '63%', left: '21.5%', width: '12px', height: '12px', roomId: 49,type: 'desk' },
    { id: 43, top: '63%', left: '26.5%', width: '12px', height: '12px', roomId: 50,type: 'desk' },
    
    { id: 44, top: '69.5%', left: '21.5%', width: '12px', height: '12px', roomId: 51,type: 'desk' },
    { id: 45, top: '69.5%', left: '26.5%', width: '12px', height: '12px', roomId: 52,type: 'desk' },
    { id: 46, top: '73%', left: '21.5%', width: '12px', height: '12px', roomId: 53,type: 'desk' },
    { id: 47, top: '73%', left: '26.5%', width: '12px', height: '12px', roomId: 54,type: 'desk' },

    { id: 48, top: '83.5%', left: '11.5%', width: '12px', height: '12px', roomId: 55,type: 'desk' },
    { id: 49, top: '89.5%', left: '11.5%', width: '12px', height: '12px', roomId: 56,type: 'desk' },
    { id: 50, top: '83.5%', left: '14.5%', width: '12px', height: '12px', roomId: 57,type: 'desk' },
    { id: 51, top: '89.5%', left: '14.5%', width: '12px', height: '12px', roomId: 58,type: 'desk' },

    { id: 52, top: '83.5%', left: '19%', width: '12px', height: '12px', roomId: 59,type: 'desk' },
    { id: 53, top: '87.5%', left: '19%', width: '12px', height: '12px', roomId: 60,type: 'desk' },
    { id: 54, top: '91.5%', left: '19%', width: '12px', height: '12px', roomId: 61,type: 'desk' },

    { id: 55, top: '83.5%', left: '21.5%', width: '12px', height: '12px', roomId: 62,type: 'desk' },
    { id: 56, top: '87.5%', left: '21.5%', width: '12px', height: '12px', roomId: 63,type: 'desk' },
    { id: 57, top: '91.5%', left: '21.5%', width: '12px', height: '12px', roomId: 64,type: 'desk' },

    { id: 58, top: '83.5%', left: '26.5%', width: '12px', height: '12px', roomId: 65,type: 'desk' },
    { id: 59, top: '87.5%', left: '26.5%', width: '12px', height: '12px', roomId: 66,type: 'desk' },
    { id: 60, top: '91.5%', left: '26.5%', width: '12px', height: '12px', roomId: 67,type: 'desk' },
    
  ],
  
  // 添加更多地图的遮罩配置
};

function SelectMap() {
  const [selectedLevel, setSelectedLevel] = useState('A-K17-B');
  const navigate = useNavigate();

  const handleLevelChange = (event) => {
    setSelectedLevel(event.target.value);
  };

  const handleOverlayClick = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="selectMapContainer">
      {/* <h2 className="map-title">Select by Map</h2>  */}
      <Link to="/dashboard" className="back-button">Back to Dashboard</Link>
      <div className="selectRow">
        <label htmlFor="levelSelect" className="selectLabel">
          Select level:
        </label>
        <select
          id="levelSelect"
          value={selectedLevel}
          onChange={handleLevelChange}
        >
          <option value="">Select a level</option>
          {level.map((l) => (
            <option key={l.id} value={l.level}>{l.level}</option>
          ))}
        </select>
      </div>
      {selectedLevel && (
        <div className="map-container">
        <img
          src={`/levelMap/${selectedLevel}.jpg`}
          alt={`Level ${selectedLevel}`}
          className="map-image"
        />
        {mapOverlays[selectedLevel] && mapOverlays[selectedLevel].map((overlay) => (
            <div
              key={overlay.id}
              className={`clickable-area ${overlay.type}`}
              style={{
                top: overlay.top,
                left: overlay.left,
                width: overlay.width,
                height: overlay.height,
              }}
              onClick={() => handleOverlayClick(overlay.roomId)}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SelectMap;