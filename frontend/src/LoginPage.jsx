import React from 'react';
import './LoginPage.css';

const LoginPage = () => {
  const handleZIDLogin = () => {
    const microsoftLoginUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
    const clientId = "72e7ab5f-0d1c-48ee-9fde-fe74a8095189"; 
    const redirectUri = encodeURIComponent("https://k17roombooking.unsw.edu.au/auth/callback");
    const scope = encodeURIComponent("openid profile email");
    const fullLoginUrl = `${microsoftLoginUrl}?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&response_mode=query`;
    
    openPopupWindow(fullLoginUrl, 'MicrosoftLogin');
  };

  const handleOutlookLogin = () => {
    const outlookLoginUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
    const clientId = "YOUR_CLIENT_ID_HERE"; // Replace with actual client ID
    const redirectUri = encodeURIComponent("YOUR_REDIRECT_URI_HERE"); // Replace with redirect URI
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

  return (
    <div className="login-page">
      <div className="overlap-group-wrapper">
        <div className="overlap-group">
          <img className="IMG" alt="Img" src="/img/img-3572-1.png" />
          <img className="vector" alt="Vector" src="/img/vector-1.svg" />
          <div className="rectangle" />
          <img className="img" alt="Rectangle" src="/img/rectangle-7.png" />
          <div className="text-wrapper" onClick={() => console.log("Change password clicked")}>Change password</div>
          <img className="rectangle-2" alt="Rectangle" src="/img/rectangle-7.png" />
          <img className="office-logos" alt="Office logos" src="/img/office-logos.svg" />
          <div className="div" />
          <img className="unsw" alt="Unsw" src="/img/ym8vvr-unsw-1.svg" />
          <div className="rectangle-3" />
          <p className="p" onClick={handleZIDLogin}>Agree and sign on with zID</p>
          <div className="text-wrapper-2" onClick={handleOutlookLogin}>Sign on with outlook</div>
          <div className="text-wrapper-3" onClick={() => console.log("Forgot password clicked")}>Forgot password</div>
          <div className="text-wrapper-4">K17 room booking system</div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;