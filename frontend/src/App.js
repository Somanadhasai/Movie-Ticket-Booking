import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import MovieListing from './components/MovieListing';
import MovieDetails from './components/MovieDetails';
import BookingPage from './components/BookingPage';
import SeatSelection from './components/SeatSelection';
import Payment from './components/Payment';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/movies" element={<MovieListing />} />
        <Route path="/details" element={<MovieDetails />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/seats" element={<SeatSelection />} />
        <Route path="/payment" element={<Payment />} />
        {/* Optional: fallback for unknown routes */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;