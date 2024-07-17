import "./LoginPage.css";
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const LoginPage = ({ onLogin }) => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [zid, setZid] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const accessToken = queryParams.get("access_token");
    const loginFailed = queryParams.get("false");

    console.log("LoginPage: accessToken =", accessToken, "loginFailed =", loginFailed);

    if (accessToken) {
      // handleAutoLogin(accessToken);
    } else if (loginFailed) {
      setError("Outlook login failed. Please try again.");
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("isLoggedIn");
    }
  }, [location]);

  const handleSuccessfulLogin = (data) => {
    console.log("Login successful. Data:", data);
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("isAdmin", data.is_admin.toString());
    onLogin(data.access_token, data.is_admin);

    const fromQr = location.state?.fromQr;
    const qrCode = localStorage.getItem("qrCode");

    console.log("fromQr =", fromQr, "qrCode =", qrCode);

    if (fromQr && qrCode) {
      console.log("Navigating to QR check-in");
      navigate("/qr-check-in");
    } else if (data.is_admin) {
      console.log("Navigating to admin page");
      navigate("/admin");
    } else {
      console.log("Navigating to dashboard");
      navigate("/dashboard");
    }
  };

  const handleZIDLogin = () => {
    console.log("Showing ZID login form");
    setShowLoginForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    console.log("Attempting login with ZID:", zid);
    try {
      const response = await fetch("http://s2.gnip.vip:37895/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ zid, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login successful");
        handleSuccessfulLogin(data);
      } else {
        console.log("Login failed:", data);
        setError(data.message || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please try again later.");
    }
  };

  const handleOutlookLogin = () => {
    console.log("Initiating Outlook login");
    window.location.href = "http://localhost:5001/auth/outlook-login";
  };

  const handleForgotPassword = () => {
    console.log("Navigating to forgot password page");
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