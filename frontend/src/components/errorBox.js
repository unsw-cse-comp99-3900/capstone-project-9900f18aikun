import "./errorBox.css"; // Ensure you create the CSS file for styling

function ErrorBox({ message, onClose }) {
  return (
    <div className="popup-overlay">
      <div className="popup-dialog">
        <div className="popup-message">{message}</div>
        <div className="popup-buttons">
          <button className="popup-button" onClick={onClose}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default ErrorBox;
