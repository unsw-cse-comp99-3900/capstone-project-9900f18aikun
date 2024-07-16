import React, { useState } from 'react';
import { DatePicker } from '@arco-design/web-react'; // 确保导入DatePicker组件
import dayjs from 'dayjs'; // 导入dayjs库，如果DatePicker依赖于此
import './adminAppointment.css'; // 引入CSS文件

function AdminAppointment() {
    const [date, setDate] = useState(dayjs()); // 使用useState来管理日期状态

    const handleDateChange = (dateValue) => {
        setDate(dayjs(dateValue)); // 更新日期状态
    };

    return (
        <div>
            <h1>Appointment Management</h1>
            <div className='appointment-pickDate'>
                <label htmlFor="appointment-date-picker">Select date: </label>
                <DatePicker 
                    id="appointment-date-picker"
                    style={{ width: 200 }}
                    onChange={(_, dateValue) => handleDateChange(dateValue)}
                    format="YYYY-MM-DD"
                    defaultValue={dayjs()}  // 设置默认日期为当天
                />
                <p>Selected Date: {date.format('YYYY-MM-DD')}</p>
            </div>
        </div>
    );
}

export default AdminAppointment;