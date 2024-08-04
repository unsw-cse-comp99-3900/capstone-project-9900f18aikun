import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@arco-design/web-react';
import './Admin_page.css';
import AdminHome from './admin_comp/adminHome';
import AdminClassroom from './admin_comp/adminClassroom';
import AdminAppointment from './admin_comp/adminAppointment';
import AdminStatistics from './admin_comp/adminStatistics';
import AdminUser from './admin_comp/adminUser';
import AdminChatbox from './AdminChatbox';
import AdminNotification from './AdminNotification';
import { Route, Routes } from 'react-router-dom';
import '@arco-design/web-react/dist/css/arco.css';

function AdminPage({ token }) {
  // State variables
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [contentState, setContentState] = useState(1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showChatbox, setShowChatbox] = useState(false);
  const [appointmentKey, setAppointmentKey] = useState(0); // Key to force re-render of AdminAppointment
  const [forceUpdate, setForceUpdate] = useState(false); // Flag to force update
  const navigate = useNavigate();

  // Function to refresh the AdminAppointment component
  const refreshAppointment = () => {
    setAppointmentKey((prevKey) => prevKey + 1); // Update key to refresh component
  };

  // Function to toggle the sidebar visibility
  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Dynamic style for the top bar based on sidebar state
  const topBarStyle = {
    left: isSidebarOpen ? '270px' : '0',
    width: isSidebarOpen ? 'calc(100% - 270px)' : '100%',
  };

  // Effect to handle browser back button
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

  // Effect to scroll to top when content state changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [contentState]);

  // Function to handle user logout
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
        <button onClick={() => navigate('/admin')}>
          <img src="/admin_img/home.png" alt="Home" />
          Home page
        </button>
        <button onClick={() => navigate('/admin/users')}>
          <img src="/admin_img/student.png" alt="User Management" />
          User management
        </button>
        <button onClick={() => navigate('/admin/classrooms')}>
          <img src="/admin_img/classroom.png" alt="Classroom Management" />
          Classroom management
        </button>
        <button onClick={() => navigate('/admin/appointment')}>
          <img src="/admin_img/appointment.png" alt="Appointment Management" />
          Appointment management
        </button>
        <button onClick={() => navigate('/admin/statistics')}>
          <img src="/admin_img/checkin.png" alt="Check-in Statistics" />
          Statistics
        </button>
      </div>

      {/* Top bar */}
      <div
        className={`admin-top-bar ${isSidebarOpen ? '' : 'closed'}`}
        style={topBarStyle}
      >
        <button onClick={toggleSidebar} className="admin-closebar">
          ☰
        </button>

        <div className="admin-top-bar-right">
          <AdminNotification
            refreshAppointment={refreshAppointment}
            contentState={contentState}
            setForceUpdate={setForceUpdate}
          />
          <AdminChatbox onToggle={setShowChatbox} />
          <button
            className="admin-user"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <img src="/admin_img/user.png" alt="User" />
          </button>
        </div>

        {showDropdown && (
          <div className="dropdown-menu">
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div
        className="admin-content"
        style={{ marginLeft: isSidebarOpen ? '270px' : '20px' }}
      >
        <Routes>
          <Route path="/" element={<AdminHome />} />
          <Route path="/users" element={<AdminUser />} />
          <Route path="/classrooms" element={<AdminClassroom />} />
          <Route
            path="/appointment"
            element={
              <AdminAppointment
                token={token}
                forceUpdate={forceUpdate}
                key={forceUpdate}
              />
            }
          />
          <Route path="/statistics" element={<AdminStatistics />} />
        </Routes>
      </div>
    </div>
  );
}

export default AdminPage;
