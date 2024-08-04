import React, { useState } from 'react';
import './HeaderBar.css';
import { useNavigate } from 'react-router-dom';
import { Dropdown, Menu, Button } from '@arco-design/web-react';
import api from '../api';

// Function to verify if the user is an admin
const verifyID = async (SetIsAdmin) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(api + `/admin/check_admin`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: 'Bearer ' + token,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch booking data');
    } else if (response.ok) {
      const result = await response.json();
      SetIsAdmin(result.is_admin);
    }
  } catch (error) {}
};

// HeaderBar component
const HeaderBar = ({ onLogout, onHistory }) => {
  const [isAdmin, SetIsAdmin] = useState(false);
  const navigate = useNavigate();
  verifyID(SetIsAdmin);

  // Menu items for the dropdown
  const menu = (
    <Menu>
      {!isAdmin && (
        <Menu.Item key="1" onClick={onHistory}>
          History
        </Menu.Item>
      )}
      <Menu.Item key="2" onClick={onLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="header-bar">
      <div className="overlap">
        <img
          className="image"
          alt="UNSW Logo"
          src="/img/image-164.png"
          onClick={() => {
            if (isAdmin) {
              navigate('/admin');
            } else {
              navigate('/dashboard');
            }
          }}
        />
        <Dropdown
          droplist={menu}
          trigger="click"
          position="br"
          className="arco-dropdown"
        >
          <Button type="text" className="arco-btn">
            <img
              src="/admin_img/user.png"
              alt="User"
              style={{ height: '40px' }}
            />
          </Button>
        </Dropdown>
      </div>
    </div>
  );
};

export default HeaderBar;
