import React, { useState, useEffect } from 'react';
import { DatePicker, Table, ConfigProvider, Notification  } from '@arco-design/web-react';
import dayjs from 'dayjs';
import enUS from '@arco-design/web-react/es/locale/en-US';
import './adminAppointment.css';

function AdminAppointment({ token,forceUpdate }) {
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
                const response = await fetch(`/api/history/alluser-booking-history?date=${formattedDate}`, {
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
                const response = await fetch('/api/booking/show-request', {
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
    }, [date, token,forceUpdate]);

    const formatTime = (time) => {
        return time.slice(0, 5); // 只取前5个字符，即 "HH:MM"
    };

    const calculateBookingHour = (startTime, endTime) => {
        const start = dayjs(startTime, 'HH:mm');
        const end = dayjs(endTime, 'HH:mm');
        return end.diff(start, 'hour', true); // 计算小时数
    };

    const handleApprove = async (entry) => {
        
        try {
            const response = await fetch('/api/booking/handle-request', {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    booking_id: entry.booking_id,
                    confirmed: true,
                }),
            });
            const data = await response.json();
            console.log(data.message);
            Notification.success({
                closable: false,
                title: 'Notification',
                content: 'You have approved the booking request.',
            });
            // 更新 requestData 状态，移除已处理的请求
            setRequestData((prevData) => prevData.filter(item => item.booking_id !== entry.booking_id));
        } catch (error) {
            console.error('Error approving request:', error);
        }
    };

    const handleReject = async (entry) => {
        
        try {
            const response = await fetch('/api/booking/handle-request', {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    booking_id: entry.booking_id,
                    confirmed: false,
                }),
            });
            const data = await response.json();
            console.log(data.message);
            Notification.success({
                closable: false,
                title: 'Notification',
                content: 'You have rejected the booking request.',
            });
            // 更新 requestData 状态，移除已处理的请求
            setRequestData((prevData) => prevData.filter(item => item.booking_id !== entry.booking_id));
        } catch (error) {
            console.error('Error rejecting request:', error);
        }
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
            title: 'Booking Hour (h)',
            key: 'booking_hour',
            render: (_, record) => calculateBookingHour(record.start_time, record.end_time),
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
    {
        title: 'Booking Hour (h)',
        key: 'booking_hour',
        render: (_, record) => calculateBookingHour(record.start_time, record.end_time),
    },
    {
        title: 'Confirm Request',
        key: 'confirm_request',
        render: (_, entry) => (
            <button className="table-button" onClick={() => handleApprove(entry)}>
                <img src="/admin_img/Check.png" alt="approve" />
            </button>
        ),
    },
    {
        title: 'Reject Request',
        key: 'reject_request',
        render: (_, entry) => (
            <button className="table-button" onClick={() => handleReject(entry)}>
                <img src="/admin_img/Dell.png" alt="delete" />
            </button>
        ),
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