import React from 'react';
import BookingPage from './components/BookingPage';
import Login from './components/Login';
import MovieDetails from './components/MovieDetails';
import MovieListing from './components/MovieListing';
import Payment from './components/Payment';
import SeatSelection from './components/SeatSelection';

function App() {
  return (
    <div>
      <h1>Movie Ticket Booking App</h1>
      <Login />
      <MovieListing />
      <MovieDetails />
      <BookingPage />
      <SeatSelection />
      <Payment />
    </div>
  );
}

export default App;