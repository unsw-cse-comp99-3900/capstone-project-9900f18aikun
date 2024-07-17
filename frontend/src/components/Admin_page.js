import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@arco-design/web-react';
import './Admin_page.css';
import AdminHome from './admin_comp/adminHome';
import AdminClassroom from './admin_comp/adminClassroom';
import AdminAppointment from './admin_comp/adminAppointment';
import AdminStatistics from './admin_comp/adminStatistics'; 
import AdminChatbox from './AdminChatbox'; // Import the AdminChatbox component

import '@arco-design/web-react/dist/css/arco.css';

function AdminPage({token}) {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [contentState, setContentState] = useState(1);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showChatbox, setShowChatbox] = useState(false);
    const navigate = useNavigate();

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    const topBarStyle = {
        left: isSidebarOpen ? '270px' : '0',
        width: isSidebarOpen ? 'calc(100% - 270px)' : '100%'
    };

    useEffect(() => {
        const handlePopState = (event) => {
            localStorage.removeItem('token');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('isAdmin');
            navigate('/login');
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [navigate]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [contentState]);

    const renderContent = () => {
        switch (contentState) {
            case 1:
                return <AdminHome />;
            case 2:
                return <AdminClassroom />;
            case 3:
                return <AdminAppointment token={token} />;
            case 4:
                return <AdminStatistics />;
            default:
                return <div>Error: 组件未渲染</div>;
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('isAdmin');
        navigate('/login');
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
                
                <Badge count={15}>
                    <button className='admin-message' onClick={() => setShowChatbox(!showChatbox)}>
                        <img src="/admin_img/Message.png" alt="Message" />
                    </button>
                </Badge>

                <button className='admin-user' onClick={() => setShowDropdown(!showDropdown)}>
                    <img src="/admin_img/user.png" alt="User" />
                </button>
                {showDropdown && (
                    <div className="dropdown-menu">
                        <button onClick={handleLogout}>Logout</button>
                    </div>
                )}
            </div>
            <div className="admin-content" style={{ marginLeft: isSidebarOpen ? '270px' : '20px' }}>
                {renderContent()}
            </div>
            {showChatbox && <AdminChatbox onClose={() => setShowChatbox(false)} />}
        </div>
    );
}

export default AdminPage;