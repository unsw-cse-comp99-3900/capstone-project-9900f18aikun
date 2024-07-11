import React from 'react';
import './adminClassroom.css';

function AdminClassroom() {
    return (
        <div>
            <h1>Classroom Management</h1>
            <form className='search'>
                <h2>Search classroom</h2>
                <div className='search_1'>
                    <label>Room types:</label>
                    <select defaultValue="meeting_room">
                        <option value="meeting_room">Meeting Room</option>
                        <option value="hot_desk">Hot Desk</option>
                        <option value="all" > All</option>
                        
                    </select>
                </div>
                <div className="input-group">
                    <input type="text" placeholder="Please input room name or level" />
                    <button type="submit" className="search-button">
                        <img src="/admin_img/search.png" alt="Search" />
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AdminClassroom;