import React from "react";
import "./HeaderBar.css";

const HeaderBar = ({ onLogout }) => {
  return (
    <div className="header-bar">
      <div className="overlap">
        <img className="image" alt="UNSW Logo" src="/img/image-164.png" />
        {/* <div className="text-wrapper-2">History</div> */}
        <button className="logout-button" onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
};

export default HeaderBar;