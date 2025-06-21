-- Create seats table with optimized column lengths to avoid key length issues
CREATE TABLE IF NOT EXISTS seats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  movie VARCHAR(100) NOT NULL,
  theater VARCHAR(100) NOT NULL,
  showtime VARCHAR(50) NOT NULL,
  seat_number VARCHAR(10) NOT NULL,
  status ENUM('available', 'sold', 'locked') DEFAULT 'available',
  booking_id INT,
  locked_by VARCHAR(100),
  locked_at TIMESTAMP NULL,
  sold_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_seat_show (movie(50), theater(50), showtime(30), seat_number),
  INDEX idx_movie_theater_showtime (movie, theater, showtime),
  INDEX idx_status (status)
); 