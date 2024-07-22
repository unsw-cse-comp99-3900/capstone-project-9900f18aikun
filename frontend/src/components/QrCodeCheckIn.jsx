import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QrCodeCheckIn.css';

const QrCodeCheckIn = () => {
  const [qrCode, setQrCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedQrCode = localStorage.getItem('qrCode');
    if (!storedQrCode) {
      navigate('/dashboard', { replace: true });
    } else {
      setQrCode(storedQrCode);
    }

    // Prevent going back
    window.history.pushState(null, document.title, window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  const handlePopState = () => {
    window.history.pushState(null, document.title, window.location.href);
  };

  const handleCheckIn = async () => {
    if (!qrCode) {
      alert("No QR code available. Please scan a QR code first.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/sign_in/sign-in/${qrCode}`,
        {
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data === "You have signed in") {
        alert("You're checked in!");
        localStorage.removeItem('qrCode');
        navigate('/dashboard', { replace: true });
      } else {
        alert(response.data.message || "Unexpected response from server");
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert("An error occurred during check-in. Please try again.");
      }
    }
  };

  const handleGoToRoomPage = () => {
    navigate(`/room/${qrCode}`);
  };

  return (
    <div className="QR-code-check-in">
      <div className="div">
        <img
          className="overlap-group"
          src="/img/rectangle-7 2.png"
          alt="Background rectangle"
        />
        <img className="image" alt="" src="/img/image-159.png" />
        <div className="overlap" onClick={handleCheckIn}>
          <p className="text-wrapper">I want to sign in</p>
        </div>
        <div className="div-wrapper" onClick={handleGoToRoomPage}>
          <div className="text-wrapper-2">I want to book</div>
        </div>
        {qrCode && <p>QR Code: {qrCode}</p>}
      </div>
    </div>
  );
};

export default QrCodeCheckIn;