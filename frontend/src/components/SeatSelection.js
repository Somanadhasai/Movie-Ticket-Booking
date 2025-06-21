import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SeatSelection.css";

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K"];
const COLS = 18;
const SHOWTIMES = ["10:30 AM", "01:35 PM", "04:40 PM", "07:50 PM"];

function buildSeatGrid(seatArray) {
  // seatArray: [{id, state}, ...]
  const grid = [];
  let idx = 0;
  for (let r = 0; r < ROWS.length; r++) {
    const row = [];
    for (let c = 1; c <= COLS; c++) {
      const id = `${ROWS[r]}${c}`;
      // Find seat in array
      const seat = seatArray.find(s => s.id === id) || { id, state: "available" };
      row.push(seat);
      idx++;
    }
    grid.push(row);
  }
  return grid;
}

const SeatSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { movie, theaterName, showtime: initialShowtime } = location.state || {};
  const [selectedShowtime, setSelectedShowtime] = useState(initialShowtime || SHOWTIMES[0]);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!movie || !theaterName || !selectedShowtime) return;
    setLoading(true);
    console.log('Fetching seats for:', { movie: movie.title, theater: theaterName, showtime: selectedShowtime });
    fetch(`http://localhost:5000/api/seats?movie=${encodeURIComponent(movie.title)}&theater=${encodeURIComponent(theaterName)}&showtime=${encodeURIComponent(selectedShowtime)}`)
      .then(res => res.json())
      .then(data => {
        console.log('Seat API response:', data);
        setSeats(buildSeatGrid(data.seats || []));
        setSelectedSeats([]);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Seat API error:', error);
        setSeats(buildSeatGrid([]));
        setSelectedSeats([]);
        setLoading(false);
      });
  }, [movie, theaterName, selectedShowtime]);

  if (!movie || !theaterName || !selectedShowtime) {
    return <div className="error-message"><h2>Invalid booking details!</h2></div>;
  }

  const handleSeatClick = (rowIdx, colIdx) => {
    const seat = seats[rowIdx][colIdx];
    if (seat.state === "sold") return;
    const seatId = seat.id;
    console.log('Seat clicked:', seatId, 'Current selected seats:', selectedSeats);
    setSelectedSeats((prev) => {
      const newSelection = prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId];
      console.log('New selected seats:', newSelection);
      return newSelection;
    });
  };

  const handleShowtimeChange = (showtime) => {
    setSelectedShowtime(showtime);
  };

  const saveSelection = () => {
    console.log('Save selection clicked. Selected seats:', selectedSeats);
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }
    console.log('Navigating to payment with state:', {
      movie,
      theaterName,
      showtime: selectedShowtime,
      selectedSeats,
      totalAmount: selectedSeats.length * 500
    });
    navigate("/payment", {
      state: {
        movie,
        theaterName,
        showtime: selectedShowtime,
        selectedSeats,
        totalAmount: selectedSeats.length * 500 // Example price
      }
    });
  };

  return (
    <div className="seat-selection">
      <div className="seat-header">
        <button onClick={() => navigate(-1)} className="back-button">&#8592;</button>
        <div className="seat-movie-info">
          <div className="seat-movie-title">{movie.title}</div>
          <div className="seat-movie-theater">{theaterName}</div>
          <div className="seat-movie-showtime">{selectedShowtime}</div>
          <div className="seat-movie-tickets">{selectedSeats.length} Ticket{selectedSeats.length !== 1 ? "s" : ""}</div>
        </div>
      </div>
      <div className="showtime-buttons">
        {SHOWTIMES.map((st) => (
          <button
            key={st}
            className={"showtime-btn" + (selectedShowtime === st ? " selected" : "")}
            onClick={() => handleShowtimeChange(st)}
          >
            {st}
          </button>
        ))}
      </div>
      <div className="seat-map-wrapper">
        <div className="seat-map">
          <div className="seat-row seat-label-row">
            <div className="seat-label-cell"></div>
            {Array.from({ length: COLS }, (_, c) => (
              <div key={c} className="seat-label-cell">{c + 1}</div>
            ))}
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', width: '100%', padding: '2rem' }}>Loading seats...</div>
          ) : seats.map((row, rIdx) => (
            <div className="seat-row" key={ROWS[rIdx]}>
              <div className="seat-label-cell">{ROWS[rIdx]}</div>
              {row.map((seat, cIdx) => {
                let seatClass = "seat-btn ";
                if (seat.state === "sold") seatClass += "sold";
                else if (selectedSeats.includes(seat.id)) seatClass += "selected";
                else if (seat.state === "bestseller") seatClass += "bestseller";
                else seatClass += "available";
                return (
                  <button
                    key={seat.id}
                    className={seatClass}
                    disabled={seat.state === "sold"}
                    onClick={() => handleSeatClick(rIdx, cIdx)}
                  >
                    {cIdx + 1}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="screen-indicator">
        <div className="screen-svg-label">
          <svg width="180" height="28" viewBox="0 0 180 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="160" height="12" rx="6" fill="#e5e7eb" />
            <text x="90" y="20" textAnchor="middle" fontSize="12" fill="#374151" fontWeight="bold">SCREEN</text>
          </svg>
        </div>
        <div className="screen-arrow">All eyes this way please!</div>
      </div>
      <div className="seat-legend">
        <div><span className="legend-box bestseller"></span> Bestseller</div>
        <div><span className="legend-box available"></span> Available</div>
        <div><span className="legend-box selected"></span> Selected</div>
        <div><span className="legend-box sold"></span> Sold</div>
      </div>
      <button className="save-button" onClick={saveSelection}>Continue</button>
    </div>
  );
};

export default SeatSelection;
