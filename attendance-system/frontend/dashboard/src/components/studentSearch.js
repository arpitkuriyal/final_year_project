import React, { useState } from 'react';
import axios from 'axios';

const StudentSearch = () => {
  const [studentId, setStudentId] = useState('');
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');

  const handleSearch = () => {
    if (!studentId.trim()) return;

    axios.get(`http://localhost:8000/attendance/${studentId}`)
      .then(response => {
        setRecords(response.data.attendance);
        setError('');
      })
      .catch(err => {
        console.error('Error fetching student attendance:', err);
        setRecords([]);
        setError('No attendance found for this ID.');
      });
  };

  return (
    <div>
      <h2>Search Attendance by Student ID</h2>
      <input
        type="text"
        placeholder="Enter Student ID"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {records.length > 0 && (
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
            {records.map((entry, index) => (
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
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StudentSearch;
