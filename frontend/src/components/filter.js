import React, { useState } from 'react';
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
    // console.log(filters.category)
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };

  return (
    <div>
      <h2 className="filter-title">FILTER SPACES</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Level:</label>
          <select name="level" value={filters.level} onChange={handleFilterChange}>
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
          <select name="capacity" value={filters.capacity} onChange={handleFilterChange}>
            <option value="">All</option>
            <option value="3">3+</option>
            <option value="5">5+</option>
            <option value="10">10+</option>
            <option value="20">20+</option>
            <option value="50">50+</option>
            <option value="100">100+</option>
          </select>
        </div>
        <div className="form-group">
          <label>Category:</label>
          <select name="category" value={filters.category} onChange={handleFilterChange}>
            <option value="meeting_room">Meeting Room</option>
            <option value="hot_desk">Hot Desk</option>
          </select>
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default Filter;