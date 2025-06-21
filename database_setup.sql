-- Create payments table (missing from current setup)
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_number VARCHAR(32),
  card_name VARCHAR(255),
  expiry_date VARCHAR(10),
  cvv VARCHAR(10),
  amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create locked_seats table for temporary seat holds
CREATE TABLE IF NOT EXISTS locked_seats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  movie VARCHAR(255) NOT NULL,
  theater VARCHAR(255) NOT NULL,
  showtime VARCHAR(255) NOT NULL,
  seat VARCHAR(10) NOT NULL,
  email VARCHAR(255),
  locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_movie_theater_showtime (movie, theater, showtime),
  INDEX idx_locked_at (locked_at)
);

-- Create seats table to track individual seat status
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