import React, { useState } from 'react';
import Table from './components/Table';
import Filter from './components/filter';


const data = {
    "3": {"name": "CSE Basement", "building": "K17", "level": "LG", "capacity": 100, "HDR_student_permission": false, "CSE_staff_permission": true, "time_table": [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], {"id": 1, "current_user_booking": true}, [], [], []]},
    "4": {"name": "CSE Basement Board Room", "building": "K17", "level": "LG", "capacity": 12, "HDR_student_permission": false, "CSE_staff_permission": true, "time_table": [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]},
    "5": {"name": "G01", "building": "K17", "level": "G", "capacity": 3, "HDR_student_permission": true, "CSE_staff_permission": true, "time_table": [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]},
    "6": {"name": "G02", "building": "K17", "level": "G", "capacity": 3, "HDR_student_permission": true, "CSE_staff_permission": true, "time_table": [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]},
    "12": {"name": "103", "building": "K17", "level": "1", "capacity": 8, "HDR_student_permission": false, "CSE_staff_permission": true, "time_table": [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]},
    "13": {"name": "113", "building": "K17", "level": "1", "capacity": 90, "HDR_student_permission": false, "CSE_staff_permission": true, "time_table": [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]},
    "14": {"name": "201-B", "building": "K17", "level": "2", "capacity": 14, "HDR_student_permission": false, "CSE_staff_permission": true, "time_table": [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]},
    "15": {"name": "302", "building": "K17", "level": "3", "capacity": 15, "HDR_student_permission": false, "CSE_staff_permission": true, "time_table": [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]},
    "16": {"name": "401 K", "building": "K17", "level": "4", "capacity": 15, "HDR_student_permission": false, "CSE_staff_permission": true, "time_table": [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]},
    "17": {"name": "402", "building": "K17", "level": "4", "capacity": 5, "HDR_student_permission": true, "CSE_staff_permission": true, "time_table": [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]},
    "18": {"name": "403", "building": "K17", "level": "4", "capacity": 5, "HDR_student_permission": true, "CSE_staff_permission": true, "time_table": [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]},
    "19": {"name": "501M", "building": "K17", "level": "5", "capacity": 15, "HDR_student_permission": false, "CSE_staff_permission": true, "time_table": [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]},
    "20": {"name": "508", "building": "K17", "level": "5", "capacity": 6, "HDR_student_permission": false, "CSE_staff_permission": true, "time_table": [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]},
    "21": {"name": "Design Next Studio", "building": "J17", "level": "5", "capacity": 110, "HDR_student_permission": false, "CSE_staff_permission": true, "time_table": [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]}
  };


  function App() {
    const [filteredData, setFilteredData] = useState(Object.values(data));
  
    const handleFilter = (filters) => {
      const newFilteredData = Object.values(data).filter((item) => {
        return (
          (filters.level === '' || item.level === filters.level) &&
          (filters.capacity === '' || item.capacity >= filters.capacity) &&
          (filters.category === '' || filters.category === 'meetingroom')
        );
      });
      setFilteredData(newFilteredData);
    };
  
    return (
      <div style={{ display: 'flex' }}>
        <div style={{ width: '200px', marginRight: '20px' }}>
          <Filter onFilter={handleFilter} />
          {console.log(filteredData)}
        </div>
        <div>
          <Table data={filteredData} />
        </div>
      </div>
    );
  }
  
  export default App;
