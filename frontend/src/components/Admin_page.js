import React, { useState } from 'react';
import './Admin_page.css';
import AdminHome from './admin_comp/adminHome'; // 导入组件
import AdminClassroom from './admin_comp/adminClassroom'; // 导入组件
import AdminAppointment from './admin_comp/adminAppointment'; // 导入组件
import AdminStatistics from './admin_comp/adminStatistics'; 

function AdminPage() {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [contentState, setContentState] = useState(1); // 新增 state

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="admin-container">
            <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <h1>Administration</h1>
                <button onClick={() => setContentState(1)} >
                    <img src="/admin_img/home.png" alt="Home" />
                    Home page
                </button>
                <button>
                    <img src="/admin_img/student.png" alt="Student Management" />
                    Student management
                </button>
                <button onClick={() => setContentState(2)}>
                    <img src="/admin_img/classroom.png" alt="Classroom Management" />
                    Classroom management
                </button>
                <button onClick={() => setContentState(3)}>
                    <img src="/admin_img/appointment.png" alt="Appointment Management" />
                    Appointment management
                </button>
                <button onClick={() => setContentState(4)}>
                    <img src="/admin_img/checkin.png" alt="Check-in Statistics" />
                    statistics
                </button>
            </div>
            <div className={`top-bar ${isSidebarOpen ? '' : 'closed'}`}>
                <button onClick={toggleSidebar} className='closebar'>☰</button>
                
                <button className="right">Make bookings</button>
            </div>
            <div className="content" style={{ marginLeft: isSidebarOpen ? '270px' : '20px' }}>
                {/* Content goes here */}
                {contentState === 1 && <AdminHome/>}
                {contentState === 2 && <AdminClassroom />}
                {contentState === 3 && <AdminAppointment />}
                {contentState === 4 && <AdminStatistics />}
            </div>
        </div>
    );
}

export default AdminPage;
