import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin_page.css';
import AdminHome from './admin_comp/adminHome';
import AdminClassroom from './admin_comp/adminClassroom';
import AdminAppointment from './admin_comp/adminAppointment';
import AdminStatistics from './admin_comp/adminStatistics'; 

function AdminPage() {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [contentState, setContentState] = useState(1);
    const navigate = useNavigate();

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    // 使用内联样式动态调整顶部栏的 left 和 width 属性
    const topBarStyle = {
        left: isSidebarOpen ? '270px' : '0',
        width: isSidebarOpen ? 'calc(100% - 270px)' : '100%'
    };

    useEffect(() => {
        const handlePopState = (event) => {
            // Clear login state
            localStorage.removeItem('token');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('isAdmin');
            
            // Navigate to login page
            navigate('/login');
        };

        // Add event listener for the popstate event
        window.addEventListener('popstate', handlePopState);

        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [navigate]);

    const renderContent = () => {
        switch (contentState) {
            case 1:
                return <AdminHome />;
            case 2:
                return <AdminClassroom />;
            case 3:
                return <AdminAppointment />;
            case 4:
                return <AdminStatistics />;
            default:
                return <div>Error: 组件未渲染</div>;
        }
    };

    return (
        <div className="admin-page">
            <div className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
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
            <div className={`admin-top-bar ${isSidebarOpen ? '' : 'closed'}`} style={topBarStyle}>
                <button onClick={toggleSidebar} className='admin-closebar'>☰</button>
                <button className='admin-user'>
                    <img src="/admin_img/user.png" alt="User" />
                </button>
                {/* <button className="admin-right-button">Make bookings</button> */}
            </div>
            <div className="admin-content" style={{ marginLeft: isSidebarOpen ? '270px' : '20px' }}>
                {renderContent()}
            </div>
        </div>
    );
}

export default AdminPage;