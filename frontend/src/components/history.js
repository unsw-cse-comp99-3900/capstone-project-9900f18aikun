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
          console.log("history result is ", result);
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

  const cancelHandler = async (entry, e) => {
    console.log(e.target.innerText);
    if (e.target.innerText === "Cancel") {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch("/api/booking/book/" + entry.booking_id, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + token,
          },
          // body: JSON.stringify(obj),
        });

        if (response.ok) {
          console.log("successfully deleted");
          // if no reservation for this day
        } else {
          const errorText = await response.text();
          console.error("Server responded with an error:", errorText);
          throw new Error("Something went wrong");
        }
      } catch (error) {
        console.error("Error fetching booking data:", error);
      }
    } else if (e.target.innerText === "Rebook") {
      console.log("row is", entry);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="reservation-history">
      <header>
        <h1>Reservation History:</h1>
      </header>
      {history.length > 0 ? (
        <TableContainer>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell align="center">Date</TableCell>
                <TableCell align="center">Time</TableCell>
                <TableCell align="center">Room</TableCell>
                <TableCell align="center">Booking Status</TableCell>
                <TableCell align="center">Operation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((row) => (
                <TableRow key={row.booking_id} align="center">
                  <TableCell component="th" scope="row" align="center">
                    {row.date}
                  </TableCell>
                  <TableCell align="center">
                    {row.start_time} - {row.end_time}
                  </TableCell>
                  <TableCell align="center">{row.room_name}</TableCell>
                  <TableCell align="center">{row.booking_status}</TableCell>
                  <TableCell
                    align="center"
                    id={row.booking_id}
                    onClick={(e) => cancelHandler(row, e)}
                    style={{ cursor: "pointer", color: "red" }}
                  >
                    {row.booking_status === "cancelled" ||
                    row.booking_status === "completed"
                      ? "Rebook"
                      : "Cancel"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <div className="no-history">No previous reservation history</div>
      )}
    </div>
  );
};

export default ReservationHistory;
