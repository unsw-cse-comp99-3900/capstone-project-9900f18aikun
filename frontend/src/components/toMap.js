// ToMap.js
import React from "react";
import { Link } from "react-router-dom";
import "./ToMap.css";

function ToMap() {
  return (
    <div className="to-map-container">
      <Link to="/select-map" className="to-map-link">
        Click to select by map
      </Link>
    </div>
  );
}

export default ToMap;
