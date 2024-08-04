// This file defines the ToMap component, which provides a link for users to navigate to the map selection page.
import React from 'react';
import { Link } from 'react-router-dom';

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
