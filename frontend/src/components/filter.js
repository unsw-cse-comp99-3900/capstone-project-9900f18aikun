import React, { useState } from 'react';
import { Slider } from '@arco-design/web-react';
import './filter.css'; 

function Filter({ onFilter }) {
  const [filters, setFilters] = useState({
    level: '',
    capacity: '',
    category: 'meeting_room'
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: name === 'capacity' ? parseInt(value) || '' : value
    });
  };

  const handleSliderChange = (value) => {
    setFilters({
      ...filters,
      capacity: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };

  return (
    <div>
      <h2 className="filter-title">ROOM FILTER</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Level:</label>
          <select className='filter-select' name="level" value={filters.level} onChange={handleFilterChange}>
            <option value="">All</option>
            <option value="LG">LG</option>
            <option value="G">G</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>
        <div className="form-group">
          <label>Capacity:</label>
          <Slider
            defaultValue={0}
            max={100}
            value={filters.capacity}
            onChange={handleSliderChange}
            showInput={{
              style: {
                backgroundColor: '#6a4f9c', // This attempts to set the background color
                color: 'white',
              }
            }}
            style={{ width: '100%' }}
          />
        </div>
        <div className="form-group">
          <label>Category:</label>
          <select name="category" value={filters.category} onChange={handleFilterChange} className='filter-select'>
            <option value="all">All</option> {/* 添加 'all' 选项 */}
            <option value="meeting_room">Meeting Room</option>
            <option value="hot_desk">Hot Desk</option>
          </select>
        </div>
        <button type="submit" className='filter-button'>Submit</button>
      </form>
    </div>
  );
}

export default Filter;