import React, { useState } from 'react';

function Filter({ onFilter }) {
  const [filters, setFilters] = useState({
    level: '',
    capacity: '',
    category: 'meetingroom'
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: name === 'capacity' ? parseInt(value) || '' : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
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
      <div>
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
      <div>
        <label>Category:</label>
        <select name="category" value={filters.category} onChange={handleFilterChange}>
          <option value="meetingroom">Meeting Room</option>
        </select>
      </div>
      <button type="submit">Apply Filters</button>
    </form>
  );
}

export default Filter;