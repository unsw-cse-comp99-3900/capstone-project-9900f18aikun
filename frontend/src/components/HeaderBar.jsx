import React, { useState } from "react";
import "./HeaderBar.css";
import { useNavigate } from "react-router-dom";
import { Dropdown, Menu, Button } from "@arco-design/web-react";

const verifyID = async (SetIsAdmin) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/admin/check_admin`, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: "Bearer " + token,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch booking data");
    } else if (response.ok) {
      const result = await response.json();
      SetIsAdmin(result.is_admin);
    }
  } catch (error) {
    console.error("Error fetching booking data:", error);
  }
};
const HeaderBar = ({ onLogout, onHistory }) => {
  const [isAdmin, SetIsAdmin] = useState(false);
  const navigate = useNavigate();
  verifyID(SetIsAdmin);

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
              navigate("/admin");
            } else {
              navigate("/dashboard");
            }
          }}
        />
        {/* <button
          className="back-button"
          onClick={() => {
            navigate("/dashboard");
          }}
        >
          Back
        </button> */}
        {/* <div className="text-wrapper-2">History</div> */}
        <Dropdown
          droplist={menu}
          trigger="click"
          position="bottom"
          className="arco-dropdown"
        >
          <Button type="text" className="arco-btn">
            <img
              src="/admin_img/user.png"
              alt="User"
              style={{ height: "40px" }}
            />
          </Button>
        </Dropdown>
      </div>
    </div>
  );
};

export default HeaderBar;
