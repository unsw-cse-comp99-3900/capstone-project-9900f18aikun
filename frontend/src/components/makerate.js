import React, { useState } from "react";
import { Modal, Rate, Button } from "@arco-design/web-react";

const MakeRate = ({ visible, onClose, roomid, myRate, fetchRatingData }) => {
  const [rateValue, setRateValue] = useState(myRate);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleRateSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://3.26.67.188:5001/comment/make-rate`, {
        method: "PUT",
        headers: {
          accept: "application/json",
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room_id: roomid,
          rate: rateValue,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Server responded with an error: " + errorText);
      }

      // Fetch the updated rating data
      await fetchRatingData();
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  const handleClose = () => {
    setIsSubmitted(false); // Reset the submitted state when modal is closed
    onClose(); // Call the original onClose prop
  };

  return (
    <Modal
      title="Rate this Room"
      visible={visible}
      onOk={handleRateSubmit}
      onCancel={handleClose}
      footer={isSubmitted ? [
        <Button key="cancel" onClick={handleClose}>
          Close
        </Button>
          ] : [
        <Button key="cancel" onClick={handleClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleRateSubmit}>
          Submit
        </Button>,
      ]}
    >
      {isSubmitted ? (
        <div>Rating success, thank you for your feedback！</div>
      ) : (
        <><p>My last rating:{myRate} </p>
          <div>Tap to rate</div>
          <div>
            <Rate  value={rateValue} onChange={setRateValue} />
            </div>
        </>
      )}
    </Modal>
  );
};

export default MakeRate;