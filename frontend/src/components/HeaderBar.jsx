import React from "react";
import "./HeaderBar.css";
import { useNavigate } from "react-router-dom";

const HeaderBar = ({ onLogout, onHistory }) => {
  const navigate = useNavigate();
  return (
    <div className="header-bar">
      <div className="overlap">
        <img
          className="image"
          alt="UNSW Logo"
          src="/img/image-164.png"
          onClick={() => {
            navigate("/dashboard");
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
          <button className="history-button" onClick={onHistory}>
            History
          </button>
          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeaderBar;
