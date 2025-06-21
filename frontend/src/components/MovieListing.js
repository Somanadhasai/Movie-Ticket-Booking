import React from "react";
import { useNavigate } from "react-router-dom";
import "./MovieListing.css";

const MovieListing = () => {
  const navigate = useNavigate();

  const movies = [
    {
      title: "Salaar",
      ageRating: "UA13+",
      language: "Telugu",
      poster: "/img/salaar.jpg",
      about:
        "The fate of a violently contested kingdom hangs on the fraught bond between two friends-turned-foes in this saga of power, bloodshed, and betrayal.",
      cast: [
        { name: "Prabhas", role: "Salaar" },
        { name: "Shruti Haasan", role: "Adhya" },
        { name: "Jagapathi Babu", role: "Rajamanaar" },
      ],
      crew: [
        { name: "Prashanth Neel", role: "Director" },
        { name: "Hombale Films", role: "Producer" },
      ],
    },
    {
      title: "Master",
      ageRating: "U/A16+",
      language: "Telugu",
      poster: "/img/master.jpg",
      about:
        "An action-packed thriller featuring a battle of wits between a troubled professor and a notorious gangster.",
      cast: [
        { name: "Vijay", role: "JD" },
        { name: "Vijay Sethupathi", role: "Bhavani" },
        { name: "Malivika Mohan", role: "Female Lead" },
      ],
      crew: [
        { name: "Lokesh Kanagaraj", role: "Director" },
        { name: "Xavier Britto", role: "Producer" },
      ],
    },
    {
      title: "Guntur Karaam",
      ageRating: "UA",
      language: "Telugu",
      poster: "/img/guntur_kaaram.jpg",
      about:
        "A gripping drama with unexpected twists and high-octane action sequences.",
      cast: [
        { name: "Mahesh Babu", role: "Lead Role" },
        { name: "Sreeleela", role: "Female Lead" },
      ],
      crew: [
        { name: "Trivikram Srinivas", role: "Director" },
        { name: "Haarika & Hassine Creations", role: "Producer" },
      ],
    },
  ];

  const handleDetails = (movie) => {
    navigate("/details", { state: { movie } });
  };

  return (
    <div className="movie-listing">
      <h1 className="page-title">Movies in Vijayawada</h1>
      <div className="movie-grid">
        {movies.map((movie, index) => (
          <div className="movie-card" key={index}>
            <img src={movie.poster} alt={movie.title} />
            <h3>{movie.title}</h3>
            <p className="movie-info">
              {movie.ageRating} • {movie.language}
            </p>
            <button className="classic-login-btn" onClick={() => handleDetails(movie)}>
              See Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieListing;
