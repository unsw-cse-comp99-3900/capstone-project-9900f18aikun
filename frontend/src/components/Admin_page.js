import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
//Arco message
import { Badge } from '@arco-design/web-react';
// import { IconClockCircle } from '@arco-design/web-react/icon';

import './Admin_page.css';
import AdminHome from './admin_comp/adminHome';
import AdminClassroom from './admin_comp/adminClassroom';
import AdminAppointment from './admin_comp/adminAppointment';
import AdminStatistics from './admin_comp/adminStatistics'; 
import MessageModal from './admin_comp/adminMessage'; // 引入模态组件

import '@arco-design/web-react/dist/css/arco.css';


function AdminPage() {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [contentState, setContentState] = useState(1);
    const [showDropdown, setShowDropdown] = useState(false); // 新增状态管理下拉菜单的显示
    const [showMessageModal, setShowMessageModal] = useState(false); // 状态message模态显示
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

    //跳转到页面顶部
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [contentState]); // 添加依赖项 contentState

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


    const handleLogout = () => {
        // 清除登录状态
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('isAdmin');
        // 导航到登录页面
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
                    <button className='admin-message' onClick={() => setShowMessageModal(true)}>
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
            {showMessageModal && <MessageModal onClose={() => setShowMessageModal(false)} />}
        </div>
    );
}

export default AdminPage;