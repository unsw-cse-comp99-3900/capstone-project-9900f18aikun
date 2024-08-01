import React, { useState, useEffect } from "react";
import { Table, ConfigProvider, Tooltip, Button } from "@arco-design/web-react";
import enUS from "@arco-design/web-react/es/locale/en-US";
import dayjs from "dayjs";
import "./adminHome.css"; // 引入CSS文件

function AdminHome() {
  const [bookingData, setBookingData] = useState([]);
  const [totalBookings, setTotalBookings] = useState(0); // 新增状态变量来存储当天内所有预订的数量
  const [usageData, setUsageData] = useState([]); // 新增状态变量来存储usage数据

  useEffect(() => {
    const fetchBookingData = async () => {
      const token = localStorage.getItem("token");
      const formattedDate = dayjs().format("YYYY-MM-DD");
      try {
        const response = await fetch(
          `/api/history/alluser-booking-history?date=${formattedDate}`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setBookingData(data.slice(0, 10)); // 只取最近10条记录
          setTotalBookings(data.length); // 设置当天内所有预订的数量
        } else {
          console.error("Failed to fetch booking data");
        }
      } catch (error) {
        console.error("Error fetching booking data:", error);
      }
    };

    const fetchUsageData = async () => {
      const token = localStorage.getItem("token");
      const formattedDate = dayjs().format("YYYY-MM-DD");
      try {
        const response = await fetch(
          `/api/booking/meetingroom-usage?date=${formattedDate}`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setUsageData(data.usage); // 设置usage数据
        } else {
          console.error("Failed to fetch usage data");
        }
      } catch (error) {
        console.error("Error fetching usage data:", error);
      }
    };

    fetchBookingData();
    fetchUsageData();
  }, []);

  const formatTime = (time) => {
    return time.slice(0, 5); // 只取前5个字符，即 "HH:MM"
  };

  const calculateBookingHour = (startTime, endTime) => {
    const start = dayjs(startTime, "HH:mm");
    const end = dayjs(endTime, "HH:mm");
    return end.diff(start, "hour", true); // 计算小时数
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
      render: (_, record) =>
        `${formatTime(record.start_time)} - ${formatTime(record.end_time)}`,
    },
    {
      title: "Booking Hour (h)",
      key: "booking_hour",
      render: (_, record) =>
        calculateBookingHour(record.start_time, record.end_time),
    },
    {
      title: "Booking Status",
      dataIndex: "booking_status",
      key: "booking_status",
    },
  ];

  return (
    <ConfigProvider locale={enUS}>
      <div className="home-content">
        <h1>Welcome !</h1>
        <div className="button-container">
          {["#FADC6D", "#C396ED", "#BEDAFF"].map((color, index) => (
            <Tooltip
              key={color}
              color={color}
              content={
                index === 0
                  ? `Total bookings today: ${totalBookings}`
                  : index === 1
                  ? `Total number of rooms booked today: ${usageData[0] || 0}`
                  : "Total user numbers: 290"
              }
            >
              <Button
                className="button-style"
                style={{
                  background: color,
                  height: "65px",
                  fontSize: "18px",
                }}
              >
                {
                  ["Appointment numbers", "Classroom numbers", "User numbers"][
                    index
                  ]
                }
              </Button>
            </Tooltip>
          ))}
        </div>
        <div className="recent-appointment">
          <h2>Recent Appointments</h2>
          <Table
            columns={columns}
            data={bookingData}
            rowKey="booking_id"
            pagination={{ pageSize: 5 }} // 不需要分页
          />
          {/* <p>Total bookings today: {totalBookings}</p> 显示当天内所有预订的数量 */}
        </div>
      </div>
    </ConfigProvider>
  );
}

export default AdminHome;
