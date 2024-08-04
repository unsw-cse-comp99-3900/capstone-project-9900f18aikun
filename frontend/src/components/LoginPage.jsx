import "./LoginPage.css";
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api.js";

const LoginPage = ({ onLogin, setOutlook }) => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [zid, setZid] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Effect to handle URL query parameters for access token and login failure
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const accessToken = queryParams.get("access_token");
    const loginFailed = queryParams.get("false");

    if (accessToken) {
      localStorage.setItem("token", accessToken);
      setOutlook(true)
    } else if (loginFailed) {
      setError("Outlook login failed. Please try again.");
    }
  }, [location]);

  // Function to handle successful login
  const handleSuccessfulLogin = (data) => {
    localStorage.setItem("token", data.access_token);
    onLogin(data.is_admin);

    const fromQr = location.state?.fromQr;
    const qrCode = localStorage.getItem("qrCode");

    if (fromQr && qrCode) {
      navigate("/qr-check-in");
    }
  };

  // Function to show zID login form
  const handleZIDLogin = () => {
    setShowLoginForm(true);
  };

  // Function to handle form submission for zID login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch(api + "/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ zid, password }),
      });

      const data = await response.json();

      if (response.ok) {
        handleSuccessfulLogin(data);
      } else {
        setError(data.message || "Login failed. Please try again.");
        localStorage.removeItem("token");
      }
    } catch (error) {
      setError("Network error. Please try again later.");
    }
  };

  // Function to handle Outlook login
  const handleOutlookLogin = () => {
    window.location.href = api + "/auth/outlook-login";
  };

  // Function to handle forgot password
  const handleForgotPassword = () => {
    window.location.href = "https://iam.unsw.edu.au/home";
  };

  return (
    <div className="login-page">
      <div className="overlap-group-wrapper">
        <div className="overlap-group">
          <img className="IMG" alt="Img" src="/img/img-3572-1.png" />
          <img className="vector" alt="Vector" src="/img/vector-1.svg" />
          <div className="rectangle" />
          <div className="div" />
          <img className="unsw" alt="Unsw" src="/img/ym8vvr-unsw-1.svg" />
          <div className="rectangle-3" />
          {showLoginForm ? (
            <form onSubmit={handleSubmit} className="login-form large">
              <input
                type="text"
                value={zid}
                onChange={(e) => setZid(e.target.value)}
                placeholder="zID"
                required
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
              <div className="button-group">
                <button type="submit">Submit</button>
                <button
                  type="button"
                  onClick={() => setShowLoginForm(false)}
                  className="back-button"
                >
                  Back
                </button>
              </div>
              {error && <div className="error-message">{error}</div>}
            </form>
          ) : (
            <>
              <img className="img" alt="Rectangle" src="/img/rectangle-7.png" />
              <img
                className="rectangle-2"
                alt="Rectangle"
                src="/img/rectangle-7.png"
              />
              <img
                className="office-logos"
                alt="Office logos"
                src="/img/office-logos.svg"
              />
              <p className="p" onClick={handleZIDLogin}>
                Agree and sign on with zID
              </p>
              <div className="text-wrapper-2" onClick={handleOutlookLogin}>
                Sign on with outlook
              </div>
            </>
          )}
          <div className="text-wrapper-3" onClick={handleForgotPassword}>
            Forgot password
          </div>
          <div className="text-wrapper-4">K17 room booking system</div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
