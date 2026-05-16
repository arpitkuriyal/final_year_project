import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AttendanceTable = () => {
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8000/attendance/')
      .then(response => {
        setAttendance(response.data.attendance);
      })
      .catch(error => {
        console.error('Error fetching attendance:', error);
      });
  }, []);

  return (
    <div>
      <h2>Recent Attendance</h2>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>ID</th>
            <th>Subject</th>
            <th>Lecture Slot</th>
            <th>Date</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map((entry, index) =>
          (
            <>
              {console.log(entry.date)}
              <tr key={index}>
                <td>{entry.id}</td>
                <td>{entry.subject}</td>
                <td>{entry.lecture_slot}</td>
                <td>{new Date(entry.date).toLocaleDateString()}</td>
                <td>{new Date(`1970-01-01T${entry.time}`).toLocaleTimeString(
                  "en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true
                }
                )}</td>
              </tr>
            </>

          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
