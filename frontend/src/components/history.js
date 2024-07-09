import React, { useEffect, useState } from "react";
import "./history.css";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

const ReservationHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch("/api/history/booking-history", {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: "Bearer " + token,
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log(result)
          setHistory(result);
        } else {
          const errorText = await response.text();
          throw new Error("Server responded with an error: " + errorText);
        }
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []); 

  const handleCancelClick = (id) => {
    console.log("Cancel clicked for ID:", id);
  };

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (error) {
//     return <div>Error: {error.message}</div>;
//   }

  return (
    <div className="reservation-history">
      <header>
        <h1>Reservation History:</h1>
      </header>
      <TableContainer>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell align="right">Time</TableCell>
              <TableCell align="right">Room</TableCell>
              <TableCell align="right">Booking Status</TableCell>
              <TableCell align="right">Operation</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((row) => (
              <TableRow
                key={row.booking_id}
              >
                <TableCell component="th" scope="row">
                  {row.date}
                </TableCell>
                <TableCell align="right">
                  {row.start_time} - {row.end_time}
                </TableCell>
                <TableCell align="right">{row.room_id}</TableCell>
                <TableCell align="right">{row.booking_status}</TableCell>
                <TableCell
                  align="right"
                  id={row.booking_id}
                  onClick={() => handleCancelClick(row.booking_id)}
                  style={{ cursor: "pointer", color: "red" }}
                >
                  Cancel
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default ReservationHistory;
