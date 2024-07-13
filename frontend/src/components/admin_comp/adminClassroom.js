import React, { useEffect, useState } from 'react';
import './adminClassroom.css'; // 确保 CSS 文件被引入
import { Table, ConfigProvider } from '@arco-design/web-react';
import enUS from '@arco-design/web-react/es/locale/en-US';

function AdminClassroom() {
    const [classroomData, setClassroomData] = useState([]);
    const [roomType, setRoomType] = useState('meeting_room');
    const [inputValue, setInputValue] = useState('');
    const [searchCriteria, setSearchCriteria] = useState({ type: '', value: '' });
    const [filteredData, setFilteredData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0]; // 获取当天日期并格式化为 YYYY-MM-DD

            const response = await fetch(`http://s2.gnip.vip:37895/booking/meetingroom?date=${formattedDate}`, {
                method: "GET",
                headers: {
                    'accept': 'application/json',
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcxOTMxMTE2NywianRpIjoiZGE1ODcyMGItOGMzMi00NDYwLTkzMzAtODM3YTg2NTFmNjY3IiwidHlwZSI6ImFjY2VzcyIsInN1YiI6eyJ6aWQiOiJ6NzM3MzMifSwibmJmIjoxNzE5MzExMTY3LCJjc3JmIjoiNjdkN2IwY2UtYmRhYi00NzJhLTg5MjAtZWU5ZjZkYjBiMTI2IiwiZXhwIjo3NzE5MzExMTA3fQ.fp64sgRuPSw1O4HE6Yc3ZXpd8jKeNxflOpZgGZd5cnc'
                }
            });

            const data = await response.json();
            const formattedData = Object.values(data).map(item => ({
                id: item.id,
                name: item.name,
                building: item.building,
                level: item.level,
                capacity: item.capacity,
                type: item.type,
                permission: item.permission
            }));

            // 在控制台输出前20条数据
            // console.log("First 20 items:", formattedData.slice(0, 20));

            setClassroomData(formattedData);
        };

        fetchData();
    }, []);

    const handleSelectChange = (event) => {
        setRoomType(event.target.value);
    };

    const handleInputChange = (event) => {
        setInputValue(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        let criteria = { type: '', value: '' };

        if (['1', '2', '3', '4', '5'].includes(inputValue)) {
            criteria = { type: 'level', value: inputValue };
        } else if (['G', 'LG'].includes(inputValue.toUpperCase())) {
            criteria = { type: 'level', value: inputValue.toUpperCase() };
        } else {
            criteria = { type: 'name', value: inputValue };
        }

        setSearchCriteria(criteria);
        console.log("Search Criteria:", criteria, roomType);
        const filtered = classroomData.filter(room => {
            if (criteria.type === 'level') {
                return room.level === criteria.value && (roomType === 'all' || room.type === roomType);
            } else if (criteria.type === 'name') {
                return room.name.toLowerCase().includes(criteria.value.toLowerCase()) && (roomType === 'all' || room.type === roomType);
            }
            return false;
        });

        setFilteredData(filtered);
    };

    //arco table
    const columns = [
        {
            title: 'Room Name',
            dataIndex: 'name',
        },
        {
            title: 'Building',
            dataIndex: 'building',
        },
        {
            title: 'Level',
            dataIndex: 'level',
        },
        {
            title: 'Capacity',
            dataIndex: 'capacity',
        },
        {
            title: 'Room Type',
            dataIndex: 'type',
        },
        {
            title: 'Action',  // 新列的标题
            dataIndex: 'action',
            render: () => (
                <button className="table-button">
                    <img src="/admin_img/edit.png" alt="Search" />
                </button>
            )
        }
    ];

    return (
        <ConfigProvider locale={enUS}>  {/* 使用 ConfigProvider 设置语言 */}
            <div>
                <h1 className='class-h1'>Classroom Management</h1>
                <form className='search' onSubmit={handleSubmit}>
                    <h2>Search classroom</h2>
                    <div className='search_1'>
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
                        <button type="submit" className="search-button">
                            <img src="/admin_img/search.png" alt="Search" />
                        </button>
                    </div>
                </form>
                <div className='class-table'>
                    <Table columns={columns} data={filteredData} pagination={{ pageSize: 5 }} />
                </div>
            </div>
        </ConfigProvider>
    );
}

export default AdminClassroom;