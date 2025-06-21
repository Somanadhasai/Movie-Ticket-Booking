# Movie Ticket Booking Web Application

A full-stack web application for booking movie tickets, featuring a modern React frontend and a Node.js/Express backend with MySQL database.

---

## Project Structure

```
movie-ticket-booking/
  ├── backend/         # Node.js/Express backend
  ├── frontend/        # React frontend
  ├── src/             # (Legacy/miscellaneous)
  ├── README.md        # Project documentation
  └── ...
```

---

## Features
- User registration and login (with hashed passwords)
- Movie listing, details, and booking
- Seat selection and payment processing
- User activity logging
- Modern, responsive UI with custom branding

---

## Prerequisites
- Node.js (v16+ recommended)
- npm (v8+ recommended)
- MySQL Server

---

## Setup Instructions

### 1. **Clone the Repository**
```bash
git clone <your-repo-url>
cd movie-ticket-booking
```

### 2. **Database Setup**
- Create a MySQL database (default: `movie_booking`).
- Run the following SQL to create required tables:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE user_activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  activity_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_number VARCHAR(20) NOT NULL,
  card_name VARCHAR(100) NOT NULL,
  expiry_date VARCHAR(10) NOT NULL,
  cvv VARCHAR(10) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 3. **Backend Setup**
```bash
cd backend
npm install
```

#### **Environment Variables**
Create a `.env` file in the `backend/` folder:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=movie_booking
PORT=5000
```

#### **Start the Backend Server**
```bash
npm start
```
The backend will run on [http://localhost:5000](http://localhost:5000)

---

### 4. **Frontend Setup**
```bash
cd ../frontend
npm install
```

#### **Start the Frontend Server**
```bash
npm start
```
The frontend will run on [http://localhost:3000](http://localhost:3000)

---

## Usage
- Visit [http://localhost:3000](http://localhost:3000) in your browser.
- Register a new account or log in.
- Browse movies, view details, book tickets, select seats, and make payments.

---

## Main Technologies Used
- **Frontend:** React, React Router, React Hook Form, Lucide React (icons)
- **Backend:** Node.js, Express, MySQL, bcryptjs, jsonwebtoken, dotenv

---

## Folder Details
- `frontend/` - React app source code (`src/` for components, `public/` for static assets)
- `backend/` - Express server, API endpoints, and database connection

---

## Customization
- Update movie images in `frontend/public/img/`
- Change logo in `frontend/public/img/logo.jpg`
- Edit styles in `frontend/src/App.css` and component CSS files

---

## License
This project is for educational/demo purposes. Adapt as needed for your use case. 