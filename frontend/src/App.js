import React, { useState, useEffect } from 'react';
import Table from './components/Table';
import Filter from './components/filter';
import './App.css'; // 引入CSS文件

function App() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filters, setFilters] = useState({
    level: '',
    capacity: '',
    category: 'meetingroom'
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // 控制侧边栏的状态

  const fetchBookingData = async () => {
    try {
      const response = await fetch('/api/booking/meetingroom?date=2024-06-25', {
        method: "GET",
        headers: {
          'accept': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcxOTExNTc5OSwianRpIjoiYzA5Y2IwZTEtYzFjYS00ZDY4LTg5NTAtMTI2MGQ4NzIwMGEyIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6eyJ6aWQiOiJ6MTEzMzAifSwibmJmIjoxNzE5MTE1Nzk5LCJjc3JmIjoiZjlmMGI0YmItMTgwYi00ZDllLThlNGYtN2I4MTk4OWNhMzllIiwiZXhwIjo3NzE5MTE1NzM5fQ.ZU768uMtq-LuJZYOjznoIb3zNha0XDvQu7JH8AYls1w'
        }
      });
      const text = await response.text();
      const bookingData = JSON.parse(text);
      const dataArray = Object.values(bookingData);
      console.log("data is", dataArray)
      setData(dataArray);
      setFilteredData(dataArray);
    } catch (error) {
      console.error('Error fetching booking data:', error);
    }
  };

  const handleFilter = (filters) => {
    const newFilteredData = data.filter((item) => {
      return (
        (filters.level === '' || item.level === filters.level) &&
        (filters.capacity === '' || item.capacity >= filters.capacity) &&
        (filters.category === '' || filters.category === 'meetingroom')
      );
    });
    setFilteredData(newFilteredData);
    setFilters(filters);
  };

  useEffect(() => {
    fetchBookingData();
  }, []);

  useEffect(() => {
    handleFilter(filters);
  }, [filters, data]);
  //输出筛选后的数据到控制台
  useEffect(() => {
    // console.log(filteredData);
  }, [filteredData]);

  return (
    <div className="app">
      <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <button className="toggle-button" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? '<<' : '>>'}
        </button>
        {isSidebarOpen && <Filter onFilter={handleFilter} />}
      </div>
      <div className="content">
        <Table data={filteredData} />
      </div>
    </div>
  );
}

export default App;