import React, { useState, useEffect } from 'react';
import { DatePicker, Table, ConfigProvider } from '@arco-design/web-react';
import dayjs from 'dayjs';
import enUS from '@arco-design/web-react/es/locale/en-US';
import './adminAppointment.css';

function AdminAppointment({ token }) {
    const [date, setDate] = useState(dayjs());
    const [bookingData, setBookingData] = useState([]);

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

        fetchBookingData();
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
                    <Table
                        columns={columns}
                        data={bookingData.map((item) => ({ ...item, key: item.booking_id }))}
                        pagination={{ pageSize: 5 }}
                    />
                </div>
            </div>
        </ConfigProvider>
    );
}

export default AdminAppointment;