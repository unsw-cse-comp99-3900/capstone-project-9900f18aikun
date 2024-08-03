import React, { useEffect, useState, useRef } from 'react';
import './adminClassroom.css';
import { Table, ConfigProvider } from '@arco-design/web-react';
import enUS from '@arco-design/web-react/es/locale/en-US';
import { useNavigate } from 'react-router-dom';
import api from './api';

function AdminClassroom() {
  const [classroomData, setClassroomData] = useState([]);
  const [roomType, setRoomType] = useState('meeting_room');
  const [inputValue, setInputValue] = useState('');
  const [searchCriteria, setSearchCriteria] = useState({ type: '', value: '' });
  const [filteredData, setFilteredData] = useState([]);
  const [change, setChange] = useState(true);
  // const isInitialMount = useRef(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0]; // 获取当天日期并格式化为 YYYY-MM-DD
      const token = localStorage.getItem('token');

      const response = await fetch(
        api + `/booking/meetingroom?date=${formattedDate}`,
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer ' + token,
          },
        }
      );

      const data = await response.json();
      const formattedData = Object.values(data).map((item) => ({
        id: item.id,
        name: item.name,
        is_available: item.is_available,
        building: item.building,
        level: item.level,
        capacity: item.capacity,
        type: item.type,
        permission: item.permission,
      }));
      // 在控制台输出前20条数据
      // console.log("First 20 items:", formattedData.slice(0, 20));

      setClassroomData(formattedData);
    };

    // if (isInitialMount.current) {
    //   isInitialMount.current = false;
    // } else {
    //   fetchData();
    // }

    fetchData();
  }, [change]);

  useEffect(() => {
    filter();
  }, [classroomData]);

  const handleSelectChange = (event) => {
    setRoomType(event.target.value);
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const filter = () => {
    let criteria = { type: '', value: '' };

    if (['1', '2', '3', '4', '5'].includes(inputValue)) {
      criteria = { type: 'level', value: inputValue };
    } else if (['G', 'LG'].includes(inputValue.toUpperCase())) {
      criteria = { type: 'level', value: inputValue.toUpperCase() };
    } else {
      criteria = { type: 'name', value: inputValue };
    }

    setSearchCriteria(criteria);
    // console.log("Search Criteria:", criteria, roomType);
    const filtered = classroomData.filter((room) => {
      if (criteria.type === 'level') {
        return (
          room.level === criteria.value &&
          (roomType === 'all' || room.type === roomType)
        );
      } else if (criteria.type === 'name') {
        return (
          room.name.toLowerCase().includes(criteria.value.toLowerCase()) &&
          (roomType === 'all' || room.type === roomType)
        );
      }
      return false;
    });

    setFilteredData(filtered);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    filter();
    setChange(!change);
  };

  const handleCellClick = (entry) => {
    // Custom logic for cell click
    console.log(`Clicked on :`, entry);
    navigate('/room/' + entry.id);
  };

  const handleDisable = async (entry) => {
    console.log(`Clicked on :`, entry);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        api + `/booking/block-room?roomid=` + entry.id,
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer ' + token,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch booking data');
      } else if (response.ok) {
        setChange(!change);
        console.log('this is ok');
      }
    } catch (error) {
      console.error('Error fetching booking data:', error);
    }
  };

  const handleEnable = async (entry) => {
    console.log(`Clicked on enable :`, entry);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        api + `/booking/unblock-room?roomid=` + entry.id,
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer ' + token,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch booking data');
      } else if (response.ok) {
        setChange(!change);
      }

      console.log('this is ok');
    } catch (error) {
      console.error('Error fetching booking data:', error);
    }
  };

  //arco table
  const columns = [
    {
      title: 'Room Name',
      dataIndex: 'name',
      key: 'name',
      // render: (text, entry) => (
      //     <td onClick={() => handleCellClick(entry)}>{text}</td>
      // )
    },
    {
      title: 'Building',
      dataIndex: 'building',
      key: 'building',
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
    },
    {
      title: 'Room Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Edit', // 新列的标题
      dataIndex: 'action',
      key: 'edit',
      render: (text, entry) => (
        <button className="table-button" onClick={() => handleCellClick(entry)}>
          <img src="/admin_img/edit.png" alt="edit" />
        </button>
      ),
    },
    {
      title: 'Disable',
      dataIndex: 'usage',
      key: 'disable',
      render: (text, entry) =>
        entry.is_available ? (
          <button
            className="table-button-2"
            onClick={() => handleDisable(entry)}
          >
            <img src="/admin_img/Check.png" alt="disable" />
          </button>
        ) : (
          <button
            className="table-button-2"
            onClick={() => handleEnable(entry)}
          >
            <img src="/admin_img/Cancel.png" alt="enable" />
          </button>
        ),
    },
  ];

  return (
    <ConfigProvider locale={enUS}>
      {' '}
      {/* 使用 ConfigProvider 设置语言 */}
      <div>
        <h1 className="class-h1">Classroom Management</h1>
        <form className="search">
          <h2>Search classroom</h2>
          <div className="search_1">
            <label>Room types:</label>
            <select value={roomType} onChange={handleSelectChange}>
              <option value="meeting_room">Meeting Room</option>
              <option value="hot_desk">Hot Desk</option>
              <option value="all">All</option>
            </select>
          </div>
          <div className="input-group">
            <input
              type="text"
              placeholder="Please input room name or level"
              value={inputValue}
              onChange={handleInputChange}
            />
            <button
              type="submit"
              className="search-button"
              onClick={handleSubmit}
            >
              <img src="/admin_img/search.png" alt="Search" />
            </button>
          </div>
        </form>
        <div className="class-table">
          <Table
            columns={columns}
            data={filteredData.map((item) => ({ ...item, key: item.id }))}
            pagination={{ pageSize: 5 }}
          />
        </div>
      </div>
    </ConfigProvider>
  );
}

export default AdminClassroom;
