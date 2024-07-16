import React from "react";
import "./HeaderBar.css";
import { useNavigate } from "react-router-dom";

const verifyID = async () => {
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
    }
  } catch (error) {
    console.error("Error fetching booking data:", error);
  }
};
const HeaderBar = ({ onLogout, onHistory }) => {
  const navigate = useNavigate();
  const is_admin = verifyID();
  return (
    <div className="header-bar">
      <div className="overlap">
        <img
          className="image"
          alt="UNSW Logo"
          src="/img/image-164.png"
          onClick={() => {
            if (is_admin) {
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
        <div className="button-group">
          {!is_admin && (
            <button className="history-button" onClick={onHistory}>
              History
            </button>
          )}
          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeaderBar;
