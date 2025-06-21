import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./MovieDetails.css";

const MovieDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const movie = location.state?.movie;

  if (!movie) {
    return <div className="error-message">Movie details not found.</div>;
  }

  // YouTube links for each movie
  const youtubeLinks = {
    Salaar: "https://www.youtube.com/watch?v=4GPvYMKtrtI",
    Master: "https://www.youtube.com/watch?v=UTiXQcrLlv4",
    "Guntur Karaam": "https://www.youtube.com/watch?v=DYLG65xz55U",
  };

  const videoLink = youtubeLinks[movie.title] || "#";

  const handleBooking = () => {
    navigate("/booking", { state: { movie } });
  };

  return (
    <div className="main-content">
      <button onClick={() => navigate("/movies")} className="back-button">
        ← Back
      </button>
      <div className="details-container">
        <a href={videoLink} target="_blank" rel="noopener noreferrer">
          <img src={movie.poster} alt={movie.title} className="movie-poster" />
        </a>
        <div className="details-text">
          <h1 className="movie-title">{movie.title}</h1>
          <p className="movie-info">
            {movie.ageRating} • {movie.language}
          </p>
          <section>
            <h2>About the Movie</h2>
            <p>{movie.about}</p>
          </section>
          <section>
            <h2>Cast</h2>
            <ul>
              {movie.cast.map((actor, index) => (
                <li key={index}>
                  <strong>{actor.name}</strong> as {actor.role}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2>Crew</h2>
            <ul>
              {movie.crew.map((member, index) => (
                <li key={index}>
                  <strong>{member.name}</strong> - {member.role}
                </li>
              ))}
            </ul>
          </section>
          <button className="book-now-button" onClick={handleBooking}>
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;
