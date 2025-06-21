import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./BookingPage.css";

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const movie = location.state?.movie;

  if (!movie) {
    return (
      <div className="error-message">
        <h2>No movie selected for booking.</h2>
        <button onClick={() => navigate("/")} className="back-button">← Back to Home</button>
      </div>
    );
  }

  const theaters = [
    {
      name: "Capital Cinemas Trendset Mall",
      showtimes: ["10:30 AM", "01:35 PM", "04:40 PM", "07:50 PM"],
    },
    {
      name: "Cinepolis Power One Mall",
      showtimes: ["10:15 AM", "01:30 PM", "04:40 PM", "07:50 PM"],
    },
  ];

  // Function to navigate to seats page
  const handleShowtimeClick = (theaterName, showtime) => {
    navigate("/seats", { state: { movie, theaterName, showtime } });
  };

  return (
    <div className="main-content">
      <button onClick={() => navigate(-1)} className="back-button">← Back</button>
      <h1 className="booking-title">Book Tickets for {movie.title}</h1>
      {movie.poster && (
        <img src={movie.poster} alt={movie.title} className="booking-movie-poster" style={{maxWidth: '200px', marginBottom: '1rem'}} />
      )}
      <div className="theater-list">
        {theaters.map((theater, index) => (
          <div key={index} className="theater-card">
            <h3>{theater.name}</h3>
            <div className="showtimes">
              {theater.showtimes.map((time, idx) => (
                <button key={idx} className="showtime-button" onClick={() => handleShowtimeClick(theater.name, time)}>
                  {time}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingPage;
