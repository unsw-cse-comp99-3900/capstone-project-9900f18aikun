// SelectMap.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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

function SelectMap() {
  const [selectedLevel, setSelectedLevel] = useState('');

  const handleLevelChange = (event) => {
    setSelectedLevel(event.target.value);
  };

  return (
    <div className="selectMapContainer">
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
        <img
          src={`/levelMap/${selectedLevel}.jpg`}
          alt={`Level ${selectedLevel}`}
        />
      )}
    </div>
  );
}

export default SelectMap;