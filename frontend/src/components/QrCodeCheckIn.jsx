import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './QrCodeCheckIn.css';

const QrCodeCheckIn = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedQrCode = localStorage.getItem('qrCode');
    if (storedQrCode) {
      setQrCode(storedQrCode);
    } else {
      // If there's no QR code, redirect to dashboard
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleCheckIn = () => {
    
    setIsCheckedIn(true);
    alert(`You have successfully checked in with QR code: ${qrCode}`);
    // Clear the QR code from storage after check-in
    localStorage.removeItem('qrCode');

  };

  const handleGoToRoomPage = () => {
    // Extract the room ID from the QR code
    const roomId = qrCode;
    // Navigate to the room page with the extracted room ID
    navigate(`/room/${roomId}`);
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
          <p className="text-wrapper">
            {isCheckedIn ? "You're checked in!" : "I want to sign in"}
          </p>
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