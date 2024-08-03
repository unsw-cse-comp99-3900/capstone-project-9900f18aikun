import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./QrCodeCheckIn.css";
import api from "../api";

const QrCodeCheckIn = () => {
  const [qrCode, setQrCode] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedQrCode = localStorage.getItem("qrCode");
    if (!storedQrCode) {
      navigate("/dashboard", { replace: true });
    } else {
      setQrCode(storedQrCode);
    }

    // Prevent going back
    window.history.pushState(null, document.title, window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
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
      const token = localStorage.getItem("token");
      console.log("token is", token);
      const response = await axios.get(api + `/sign_in/sign-in/${qrCode}`, {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data === "You have signed in") {
        alert("You're checked in!");
        localStorage.removeItem("qrCode");
        navigate("/dashboard", { replace: true });
      } else {
        alert(response.data.message || "Unexpected response from server");
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        alert(error.response.data.message);
      } else {
        console.log(error)
        alert("An error occurred during check-in. Please try again.");
      }
    }
  };

  const handleGoToRoomPage = () => {
    navigate(`/room/${qrCode}`);
  };

  return (
    <div className="QR-code-check-in">
      <div className="background-container"></div>
      <div className="white-overlay-left"></div>
      <div className="overlap-left">
        <div className="rectangle" />
        <div className="text-wrapper-3">UNSW</div>
        <div className="overlap" onClick={handleCheckIn}>
          <p className="text-wrapper">Check In</p>
        </div>
      </div>

      <div className="text-wrapper-4">K-17</div>
      <div className="content-container">
        <img className="image" alt="" src="/img/image-159.png" />

        <div className="div-wrapper" onClick={handleGoToRoomPage}>
          <div className="text-wrapper-2">Book</div>
        </div>
      </div>
    </div>
  );
};

export default QrCodeCheckIn;
