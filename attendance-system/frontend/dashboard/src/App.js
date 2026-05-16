import React from 'react';
import AttendanceTable from './components/attendanceTable';
import StudentForm from './components/studentForm';
import StudentSearch from './components/studentSearch';

function App() {
  return (
    <div className="App">
      <h1>Face Attendance Dashboard</h1>
      <StudentForm />
      <hr />
      <AttendanceTable />
      <hr />
      <StudentSearch />
    </div>
  );
}

export default App;
