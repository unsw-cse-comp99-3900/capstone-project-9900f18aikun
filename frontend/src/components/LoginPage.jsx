import './LoginPage.css';
import React, { useEffect, useState } from 'react';

const LoginPage = ({ onLogin }) => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [zid, setZid] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Clear any existing token when the login page loads
    localStorage.removeItem('token');
  }, []);

  const handleZIDLogin = () => {
    setShowLoginForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('http://s2.gnip.vip:37895/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ zid, password }),
      });
  
      const data = await response.json();
      
      if (response.ok) {
        // Store the token in localStorage
        localStorage.setItem('token', data.token);
        
        // Log success message
        console.log('Login successful');
        console.log('Response data:', data);
        
        // Call the onLogin function passed as a prop
        onLogin();
      } else {
        console.log('Login failed:', data);
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again later.');
    }
  };

  const handleOutlookLogin = () => {
    const outlookLoginUrl = "http://3.27.247.88/auth/outlook-login";
    const clientId = "72e7ab5f-0d1c-48ee-9fde-fe74a8095189";
    const redirectUri = encodeURIComponent("YOUR_REDIRECT_URI_HERE"); // replace with real URI
    const scope = encodeURIComponent("openid profile email https://outlook.office.com/mail.read");
    const fullLoginUrl = `${outlookLoginUrl}?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&response_mode=query&prompt=select_account`;
    openPopupWindow(fullLoginUrl, 'OutlookLogin');
  };

  const openPopupWindow = (url, name) => {
    const width = 600;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    window.open(url, name, `width=${width},height=${height},left=${left},top=${top}`);
  };

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
                <button type="button" onClick={() => setShowLoginForm(false)} className="back-button">Back</button>
              </div>
              {error && <div className="error-message">{error}</div>}
            </form>
          ) : (
            <>
              <img className="img" alt="Rectangle" src="/img/rectangle-7.png" />
              <img className="rectangle-2" alt="Rectangle" src="/img/rectangle-7.png" />
              <img className="office-logos" alt="Office logos" src="/img/office-logos.svg" />
              <p className="p" onClick={handleZIDLogin}>Agree and sign on with zID</p>
              <div className="text-wrapper-2" onClick={handleOutlookLogin}>Sign on with outlook</div>
            </>
          )}
          <div className="text-wrapper-3" onClick={handleForgotPassword}>Forgot password</div>
          <div className="text-wrapper-4">K17 room booking system</div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;