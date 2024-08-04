# CSE Space Allocation Management System

### Team: F18AIkun

## Introduction

The Computer Science and Engineering (CSE) Space Allocation Management System is a space allocation system which allows HDR students and CSE staff to book a meeting room or hot desk.

## Technology Stack

- **Frontend:** React
- **Backend:** Python Flask RESTful API
- **Database:** PostgreSQL

## Installation Guide

### Run Together

- Run the following command in the project root directory:
- docker-compose up --build

### Run Separate

**Frontend:**
- cd frontend
- docker build -t frontend .
- docker run -d -p 3000:3000 frontend  

**Backend:**
- cd backend
- docker-compose up --build

### URLs

- **Frontend URL:** http://localhost:3000
- **Backend URL and Swagger Document URL:** http://localhost:5001

## Frontend

### Project Overview

This project is a room booking system for the K17 building, designed to facilitate the process of reserving meeting rooms and hot desks. It includes features for both regular users and administrators, with a user-friendly interface for booking, checking in, and managing reservations.

### Key Features

- AI-assisted chatbox for quick room booking
- Users can communicate with admin in real time
- Map-based room selection
- QR code check-in system
- Admins can view real-time reports and analysis

### Project Structure

The main App.js file serves as the entry point of the application, handling routing and protected routes. Key components include:

-`LoginPage:` Handles user authentication

- `Dashboard:` Main user interface for bookings, include booking timetable and filter

- `SelectMap:` Provides a map-based interface for room selection

- `History:` Display users booking history

- `RoomInfo:` Shows detailed information about a specific room

- `AdminPage:` Interface for administrative management

- `QrCodeCheckIn:` Handles the QR code check-in process

The `admin_comp/` folder contains all the components specific to the admin functionality
Admin components (located in `admin_comp/`):

- `AdminDashboard.js`: Overview dashboard for administrators.
- `UserManagement.js`: Interface for managing user accounts.
- `RoomManagement.js`: Tools for adding, editing, and removing rooms.
- `BookingManagement.js`: Allows admins to view and manage all bookings.
- `ReportGeneration.js`: Generates various reports for administrative purposes.

### Technologies Used

- React

- React Router

- Day.js for date handling

- Arco Design for UI components

### API Integration

The project integrates with a backend API for data management. The base URL for the API is defined in the `api.js` file.


## Backend

### Swagger API Document Guide

Access the Swagger API documentation through http://localhost:5001.
You can use the authorize feature to add a token, please prepend "Bearer " before the token.
![Token Use](readme_photo/token_use.png 'Token Use')

### Socket IO Related Function Testing Guide

We use Postman for testing Socket.IO related functions.
![Socket IO Connect](readme_photo/user_socket_connect.png 'Socket IO Connect')
For Socket.IO related functions, we need three accounts to connect:

- One user account as the user
- One admin account for the admin
- One admin account for the monitor (We send chat history when connected, but Postman can't receive messages when connected, so we need a monitor to listen to the history).

The monitor needs to listen to messages such as `admin_chat_history`, `user_chat_history`, and `request_notification`.
The monitor needs to join the user's and admin's room by typing `{"room": "z1"}`. The user and admin need to listen to messages. The user uses `send_message` to send a message `{"msg": "hello"}`, and the admin uses `reply_message` to reply with `{"msg": "good", "user_id": "z5405325"}`. When the user sends a request, the monitor will receive a notification.

