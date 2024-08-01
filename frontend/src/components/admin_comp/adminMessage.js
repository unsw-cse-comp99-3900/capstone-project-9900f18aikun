import React from "react";
import "./adminMessage.css"; // 引入 CSS 文件

function MessageModal({ onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-header">Message</h2>
        <p className="modal-body">
          This is a message modal. Click anywhere to close.
        </p>
        <button className="modal-close-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default MessageModal;
