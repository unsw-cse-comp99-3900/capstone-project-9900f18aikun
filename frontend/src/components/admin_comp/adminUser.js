import React, { useState, useEffect } from "react";
import "./adminUser.css"; // 确保引入了 CSS 样式

import { Table, ConfigProvider } from "@arco-design/web-react";
import enUS from "@arco-design/web-react/es/locale/en-US"; // 导入英文语言包

function AdminUser() {
  const [userZid, setUserZid] = useState("");
  const [bookingHistory, setBookingHistory] = useState([]);

  const handleInputChange = (event) => {
    setUserZid(event.target.value); // 更新状态
  };

  const handleSubmit = (event) => {
    event.preventDefault(); // 阻止表单默认提交行为
    // console.log('Submitted user zid:', userZid);
    fetchBookingHistory();
  };

  const fetchBookingHistory = () => {
    const token = localStorage.getItem("token"); // 从 localStorage 获取 token
    fetch(`/api/history/certain-booking-history?user_zid=${userZid}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setBookingHistory(data); // 将返回的数据存储到状态变量中
        // console.log(data); // 打印数据以便调试
      })
      .catch((error) => {
        console.error("Error fetching booking history:", error);
      });
  };

  const columns = [
    {
      title: "User Name",
      dataIndex: "user_name",
      key: "user_name",
    },
    {
      title: "User ID",
      dataIndex: "user_id",
      key: "user_id",
    },
    {
      title: "User Email",
      dataIndex: "user_email",
      key: "user_email",
    },
    {
      title: "Room Name",
      dataIndex: "room_name",
      key: "room_name",
    },
    {
      title: "Booking Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Booking Time",
      key: "booking_time",
      render: (_, record) => `${record.start_time} - ${record.end_time}`,
    },
    {
      title: "Booking Hour (h)",
      key: "booking_hour",
      render: (_, record) => {
        const startTime = new Date(`2021-01-01T${record.start_time}`);
        const endTime = new Date(`2021-01-01T${record.end_time}`);
        return ((endTime - startTime) / (1000 * 60 * 60)).toFixed(2);
      },
    },
    {
      title: "Booking Status",
      dataIndex: "booking_status",
      key: "booking_status",
    },
  ];

  return (
    <ConfigProvider locale={enUS}>
      <div className="admin-User">
        <h1>User Management</h1>
        <form className="search" onSubmit={handleSubmit}>
          <h2>Search user booking history:</h2>
          <div className="user-input-group">
            <input
              type="text"
              placeholder="Please input user zid"
              value={userZid}
              onChange={handleInputChange}
              // className="input-group input" // 使用 adminClassroom.css 中定义的样式
            />
            <button type="submit" className="search-button">
              <img src="/admin_img/search.png" alt="Search" />
            </button>
          </div>
        </form>
        <div className="user-table">
          <Table
            columns={columns}
            data={bookingHistory}
            rowKey="booking_id"
            pagination={{ pageSize: 6 }}
          />
        </div>
      </div>
    </ConfigProvider>
  );
}

export default AdminUser;
