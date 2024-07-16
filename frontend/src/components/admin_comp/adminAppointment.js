import React, { useState, useEffect } from 'react';
import { DatePicker, Table, ConfigProvider } from '@arco-design/web-react';
import dayjs from 'dayjs';
import enUS from '@arco-design/web-react/es/locale/en-US';
import './adminAppointment.css';

function AdminAppointment({ token }) {
    const [date, setDate] = useState(dayjs());
    const [bookingData, setBookingData] = useState([]);
    const [requestData, setRequestData] = useState([]);

    const handleDateChange = (dateValue) => {
        setDate(dayjs(dateValue));
    };

    useEffect(() => {
        const fetchBookingData = async () => {
            try {
                const formattedDate = date.format('YYYY-MM-DD');
                const response = await fetch(`http://s2.gnip.vip:37895/history/alluser-booking-history?date=${formattedDate}`, {
                    method: 'GET',
                    headers: {
                        accept: 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setBookingData(data);
                } else {
                    console.error('Failed to fetch booking data');
                }
            } catch (error) {
                console.error('Error fetching booking data:', error);
            }
        };

        const fetchRequestData = async () => { // 新增请求数据
            try {
                const response = await fetch('http://s2.gnip.vip:37895/booking/show-request', {
                    method: 'GET',
                    headers: {
                        accept: 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setRequestData(data.requests);
                } else {
                    console.error('Failed to fetch request data');
                }
            } catch (error) {
                console.error('Error fetching request data:', error);
            }
        };

        fetchBookingData();
        fetchRequestData(); // 调用新增的数据获取函数
    }, [date, token]);

    const formatTime = (time) => {
        return time.slice(0, 5); // 只取前5个字符，即 "HH:MM"
    };

    const columns = [
        {
            title: 'User Name',
            dataIndex: 'user_name',
            key: 'user_name',
        },
        {
            title: 'User ID',
            dataIndex: 'user_id',
            key: 'user_id',
        },
        {
            title: 'User Email',
            dataIndex: 'user_email',
            key: 'user_email',
        },
        {
            title: 'Booking Time',
            dataIndex: 'booking_time',
            key: 'booking_time',
            render: (_, record) => `${formatTime(record.start_time)} - ${formatTime(record.end_time)}`,
        },
        {
            title: 'Booking Status',
            dataIndex: 'booking_status',
            key: 'booking_status',
            render: (text) => text === 'requested' ? 'requesting' : text,
        },
    ];

    const requestColumns = [ // 新增表格的列定义
    {
        title: 'User Name',
        dataIndex: 'user_name',
        key: 'user_name',
    },
    {
        title: 'User ID',
        dataIndex: 'user_id',
        key: 'user_id',
    },
    {
        title: 'Room Name',
        dataIndex: 'room_name',
        key: 'room_name',
    },
    {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
    },
    {
        title: 'Booking Time',
        dataIndex: 'booking_time',
        key: 'booking_time',
        render: (_, record) => `${formatTime(record.start_time)} - ${formatTime(record.end_time)}`,
    },
    ] ;

    return (
        <ConfigProvider locale={enUS}>
            <div>
                <h1>Appointment Management</h1>
                <div className='appointment-pickDate'>
                    <label htmlFor="appointment-date-picker">Select date: </label>
                    <DatePicker 
                        id="appointment-date-picker"
                        style={{ width: 200 }}
                        onChange={(_, dateValue) => handleDateChange(dateValue)}
                        format="YYYY-MM-DD"
                        defaultValue={dayjs()}
                    />
                    <p>Selected Date: {date.format('YYYY-MM-DD')}</p>
                </div>
                <div className='class-table'>
                    <h2>Bookings for Selected Date</h2> {/* 添加表头 */}
                    <Table
                        columns={columns}
                        data={bookingData.map((item) => ({ ...item, key: item.booking_id }))}
                        pagination={{ pageSize: 5 }}
                    />
                </div>
                <div className='class-table'> {/* 新增表格 */}
                    <h2>Pending Booking Requests</h2> {/* 添加表头 */}
                    <Table
                        columns={requestColumns}
                        data={requestData.map((item) => ({ ...item, key: item.booking_id }))}
                        pagination={{ pageSize: 5 }}
                    />
                </div>
            </div>
        </ConfigProvider>
    );
}

export default AdminAppointment;