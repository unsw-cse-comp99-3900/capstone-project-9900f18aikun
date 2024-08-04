import React, { useState } from "react";
import { Slider } from "@arco-design/web-react";
import "./filter.css";
import api from "../api";

// Filter component for filtering room data
function Filter({ onFilter, setData, selectedDate, setErrorMessage }) {
  // State to manage filter options
  const [filters, setFilters] = useState({
    level: "",
    capacity: "",
    category: "meeting_room",
    sort: "default",
  });

  // Function to fetch ranked data based on selected date
  const fetchRankedData = async () => {
    const token = localStorage.getItem("token");

    try {
      const formattedDate = selectedDate.format("YYYY-MM-DD");
      const response = await fetch(
        api + `/booking/meetingroom?date=${formattedDate}&is_ranked=true`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: "Bearer " + token,
          },
        }
      );
      if (response.ok) {
        const text = await response.text();
        const bookingData = JSON.parse(text);
        const dataArray = Object.values(bookingData);
        setData(dataArray);
      } else {
        setErrorMessage("Failed to Fetch Booking Data\nPlease Refresh");
      }
    } catch (error) {
      setErrorMessage("Failed to Fetch Booking Data\nPlease Refresh");
    }
  };

  // Handle changes in filter inputs
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: name === "capacity" ? parseInt(value) || "" : value,
    });
  };

  // Handle changes in the capacity slider
  const handleSliderChange = (value) => {
    setFilters({
      ...filters,
      capacity: value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (filters.sort === "rating") {
      await fetchRankedData();
    }
    onFilter(filters);
  };

  return (
    <div>
      <h2 className="filter-title">ROOM FILTER</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Level:</label>
          <select
            className="filter-select"
            name="level"
            value={filters.level}
            onChange={handleFilterChange}
          >
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
            defaultValue={1}
            min={1}
            max={100}
            onChange={handleSliderChange}
            showInput={{
              style: {
                backgroundColor: "#6a4f9c", 
                color: "white",
              },
            }}
            style={{ width: "100%" }}
          />
        </div>
        <div className="form-group">
          <label>Category:</label>
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="meeting_room">Meeting Room</option>
            <option value="hot_desk">Hot Desk</option>
          </select>
        </div>
        <div className="form-group">
          <label>Sort by:</label>
          <select
            name="sort"
            value={filters.sort}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="default">Default</option>
            <option value="rating">Rating</option>
          </select>
        </div>
        <button type="submit" className="filter-button">
          Submit
        </button>
      </form>
    </div>
  );
}

export default Filter;
