const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'movie_booking'
});

db.connect(err => {
  if (err) {
    console.error('MySQL connection error:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL');
});

// Ensure bookings table exists
const bookingsTableSql = `CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  movie VARCHAR(255) NOT NULL,
  theater VARCHAR(255) NOT NULL,
  showtime VARCHAR(50) NOT NULL,
  seats VARCHAR(255) NOT NULL,
  payment_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;
db.query(bookingsTableSql, (err) => {
  if (err) console.error('Error creating bookings table:', err);
});

// Ensure OTPs table exists
const otpsTableSql = `CREATE TABLE IF NOT EXISTS otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  type ENUM('signup', 'login') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;
db.query(otpsTableSql, (err) => {
  if (err) console.error('Error creating otps table:', err);
});

// Ensure payments table exists
const paymentsTableSql = `CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_number VARCHAR(32),
  card_name VARCHAR(255),
  expiry_date VARCHAR(10),
  cvv VARCHAR(10),
  amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;
db.query(paymentsTableSql, (err) => {
  if (err) console.error('Error creating payments table:', err);
});

// Ensure seats table exists
const seatsTableSql = `CREATE TABLE IF NOT EXISTS seats (
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
)`;
db.query(seatsTableSql, (err) => {
  if (err) console.error('Error creating seats table:', err);
});

// Setup nodemailer transporter with better error handling
let transporter;

try {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'somanadhsaiaddepalli13@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password-here'
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  
  // Test the connection
  transporter.verify(function(error, success) {
    if (error) {
      console.log('Email server connection failed:', error.message);
      console.log('Please set EMAIL_PASS environment variable with your Gmail app password');
    } else {
      console.log('Email server is ready to send messages');
    }
  });
} catch (error) {
  console.log('Failed to create email transporter:', error.message);
  transporter = null;
}

// Helper function to send emails with better error handling
const sendEmail = async (mailOptions) => {
  if (!transporter) {
    console.log('Email transporter not available. Skipping email send.');
    return { success: false, error: 'Email service not configured' };
  }
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

// Payment endpoint (now also books seats and sends email)
app.post('/api/payment', (req, res) => {
  const { cardNumber, cardName, expiryDate, cvv, amount, upiId, method, email, movie, theaterName, showtime, selectedSeats } = req.body;
  
  // Insert payment (card or upi)
  let paymentSql, paymentParams;
  if (method === 'upi') {
    // For UPI payments, store the UPI ID in card_name field for reference
    paymentSql = 'INSERT INTO payments (card_number, card_name, expiry_date, cvv, amount) VALUES (?, ?, ?, ?, ?)';
    paymentParams = [null, upiId || null, null, null, amount];
  } else {
    paymentSql = 'INSERT INTO payments (card_number, card_name, expiry_date, cvv, amount) VALUES (?, ?, ?, ?, ?)';
    paymentParams = [cardNumber || null, cardName || null, expiryDate || null, cvv || null, amount];
  }
  
  db.query(paymentSql, paymentParams, (err, result) => {
    if (err) {
      console.error('Insert error:', err);
      return res.status(500).json({ success: false, error: 'Database error' });
    }
    
    const paymentId = result.insertId;
    
    // For UPI payments, send payment request notification only (do not book seats yet)
    if (method === 'upi' && upiId) {
      console.log(`Payment request sent to UPI ID: ${upiId} for amount: ₹${amount}`);
      return res.json({ success: true, paymentId, message: 'UPI payment request sent successfully' });
    }
    
    // For card payments, book seats immediately
    if (email && movie && theaterName && showtime && selectedSeats) {
      const seatsStr = Array.isArray(selectedSeats) ? selectedSeats.join(',') : selectedSeats;
      db.query('INSERT INTO bookings (user_email, movie, theater, showtime, seats, payment_id) VALUES (?, ?, ?, ?, ?, ?)',
        [email, movie, theaterName, showtime, seatsStr, paymentId], (err2, bookingResult) => {
        if (err2) {
          console.error('Booking error:', err2);
          return res.status(500).json({ success: false, error: 'Booking error' });
        }
        
        const bookingId = bookingResult.insertId;
        
        // Mark seats as sold in the seats table
        const seatArray = Array.isArray(selectedSeats) ? selectedSeats : selectedSeats.split(',');
        console.log(`Marking ${seatArray.length} seats as sold for booking ${bookingId}:`, seatArray);
        
        const markSeatsSold = () => {
          return new Promise((resolve, reject) => {
            let completed = 0;
            let hasError = false;
            
            seatArray.forEach((seat) => {
              const seatSql = `INSERT INTO seats (movie, theater, showtime, seat_number, status, booking_id, sold_at) 
                              VALUES (?, ?, ?, ?, 'sold', ?, NOW()) 
                              ON DUPLICATE KEY UPDATE 
                              status = 'sold', booking_id = ?, sold_at = NOW()`;
              
              db.query(seatSql, [movie, theaterName, showtime, seat.trim(), bookingId, bookingId], (err) => {
                if (err && !hasError) {
                  hasError = true;
                  console.error('Error marking seat as sold:', seat, err);
                  reject(err);
                  return;
                }
                completed++;
                console.log(`Marked seat ${seat.trim()} as sold (${completed}/${seatArray.length})`);
                if (completed === seatArray.length && !hasError) {
                  console.log('All seats marked as sold successfully');
                  resolve();
                }
              });
            });
          });
        };
        
        // Send confirmation email
        const mailOptions = {
          from: process.env.EMAIL_USER || 'somanadhsaiaddepalli13@gmail.com',
          to: email,
          subject: 'Your Movie Ticket Booking Confirmation',
          html: `<h2>Booking Confirmed!</h2>
            <p><b>Movie:</b> ${movie}</p>
            <p><b>Theater:</b> ${theaterName}</p>
            <p><b>Showtime:</b> ${showtime}</p>
            <p><b>Seats:</b> ${seatsStr}</p>
            <p>Thank you for booking with us!</p>`
        };
        
        // Mark seats as sold and send email
        markSeatsSold()
          .then(() => {
            return sendEmail(mailOptions);
          })
          .then((emailResult) => {
            console.log('Seats marked as sold and email result:', emailResult);
            if (emailResult.success) {
              res.json({ success: true, paymentId, booked: true, emailSent: true, message: 'Payment processed and confirmation email sent' });
            } else {
              res.json({ success: true, paymentId, booked: true, emailSent: false, message: 'Payment processed successfully but email failed to send' });
            }
          })
          .catch((error) => {
            console.error('Error marking seats as sold or sending email:', error);
            res.json({ success: true, paymentId, booked: true, emailSent: false, message: 'Payment processed successfully' });
          });
      });
    } else {
      res.json({ success: true, paymentId, message: 'Payment processed successfully' });
    }
  });
});

// Send ticket confirmation email after UPI payment and book seats
app.post('/api/send-ticket', (req, res) => {
  const { email, movie, theaterName, showtime, selectedSeats } = req.body;
  if (!email || !movie || !theaterName || !showtime || !selectedSeats) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  const seatsStr = Array.isArray(selectedSeats) ? selectedSeats.join(',') : selectedSeats;
  
  // Insert booking (mark seats as sold)
  db.query('INSERT INTO bookings (user_email, movie, theater, showtime, seats) VALUES (?, ?, ?, ?, ?)',
    [email, movie, theaterName, showtime, seatsStr], (err2, bookingResult) => {
    if (err2) {
      console.error('Booking error:', err2);
      return res.status(500).json({ success: false, error: 'Booking error' });
    }
    
    const bookingId = bookingResult.insertId;
    
    // Mark seats as sold in the seats table
    const seatArray = Array.isArray(selectedSeats) ? selectedSeats : selectedSeats.split(',');
    console.log(`[UPI] Marking ${seatArray.length} seats as sold for booking ${bookingId}:`, seatArray);
    
    const markSeatsSold = () => {
      return new Promise((resolve, reject) => {
        let completed = 0;
        let hasError = false;
        
        seatArray.forEach((seat) => {
          const seatSql = `INSERT INTO seats (movie, theater, showtime, seat_number, status, booking_id, sold_at) 
                          VALUES (?, ?, ?, ?, 'sold', ?, NOW()) 
                          ON DUPLICATE KEY UPDATE 
                          status = 'sold', booking_id = ?, sold_at = NOW()`;
          
          db.query(seatSql, [movie, theaterName, showtime, seat.trim(), bookingId, bookingId], (err) => {
            if (err && !hasError) {
              hasError = true;
              console.error('[UPI] Error marking seat as sold:', seat, err);
              reject(err);
              return;
            }
            completed++;
            console.log(`[UPI] Marked seat ${seat.trim()} as sold (${completed}/${seatArray.length})`);
            if (completed === seatArray.length && !hasError) {
              console.log('[UPI] All seats marked as sold successfully');
              resolve();
            }
          });
        });
      });
    };
    
    // Send ticket confirmation email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'somanadhsaiaddepalli13@gmail.com',
      to: email,
      subject: 'Your Movie Ticket Booking Confirmation',
      html: `<h2>Booking Confirmed!</h2>
        <p><b>Movie:</b> ${movie}</p>
        <p><b>Theater:</b> ${theaterName}</p>
        <p><b>Showtime:</b> ${showtime}</p>
        <p><b>Seats:</b> ${seatsStr}</p>
        <p>Thank you for booking with us!</p>`
    };
    
    // Mark seats as sold and send email
    markSeatsSold()
      .then(() => {
        return sendEmail(mailOptions);
      })
      .then((emailResult) => {
        console.log('[UPI] Seats marked as sold and email result:', emailResult);
        if (emailResult.success) {
          res.json({ success: true, message: 'Ticket email sent and seats marked as sold' });
        } else {
          res.json({ success: true, message: 'Seats marked as sold but email failed to send' });
        }
      })
      .catch((error) => {
        console.error('[UPI] Error marking seats as sold or sending email:', error);
        res.status(500).json({ success: false, error: 'Failed to mark seats as sold or send ticket email' });
      });
  });
});

// Helper to generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP endpoint (passwordless)
app.post('/api/send-otp', (req, res) => {
  const { email, type } = req.body;
  if (!email || !type) {
    return res.status(400).json({ error: 'Email and type are required' });
  }
  if (type === 'signup') {
    // Check if user already exists
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (results.length > 0) {
        return res.status(409).json({ error: 'User already exists' });
      }
      sendOtpNow();
    });
  } else if (type === 'login') {
    // Check if user exists
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (results.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      sendOtpNow();
    });
  } else {
    return res.status(400).json({ error: 'Invalid type' });
  }
  function sendOtpNow() {
    const otp = generateOTP();
    db.query('INSERT INTO otps (email, otp, type) VALUES (?, ?, ?)', [email, otp, type], (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      // Send OTP email
      const mailOptions = {
        from: process.env.EMAIL_USER || 'somanadhsaiaddepalli13@gmail.com',
        to: email,
        subject: 'Your OTP for Movie Ticket Booking',
        html: `<h2>Your OTP is: <b>${otp}</b></h2><p>This OTP is valid for 5 minutes.</p>`
      };
      sendEmail(mailOptions)
        .then((info) => {
          res.json({ success: true, message: 'OTP sent to email' });
        })
        .catch((error) => {
          console.error('Error sending OTP email:', error);
          res.status(500).json({ error: 'Failed to send OTP email' });
        });
    });
  }
});

// Verify OTP endpoint (passwordless)
app.post('/api/verify-otp', async (req, res) => {
  const { email, otp, type } = req.body;
  if (!email || !otp || !type) {
    return res.status(400).json({ error: 'Email, OTP, and type are required' });
  }
  // Check OTP (valid for 5 min)
  db.query('SELECT * FROM otps WHERE email = ? AND otp = ? AND type = ? AND created_at >= NOW() - INTERVAL 5 MINUTE', [email, otp, type], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }
    // OTP is valid, delete it
    db.query('DELETE FROM otps WHERE email = ? AND type = ?', [email, type]);
    if (type === 'signup') {
      // Create user (no password)
      db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, null], (err2, result) => {
        if (err2) return res.status(500).json({ error: 'Database error' });
        db.query('INSERT INTO user_activity (user_id, activity_type) VALUES (?, ?)', [result.insertId, 'register']);
        res.json({ success: true, user: { id: result.insertId, email } });
      });
    } else if (type === 'login') {
      // Just log in
      db.query('SELECT * FROM users WHERE email = ?', [email], (err2, results2) => {
        if (err2) return res.status(500).json({ error: 'Database error' });
        if (results2.length === 0) return res.status(404).json({ error: 'User not found' });
        const user = results2[0];
        db.query('INSERT INTO user_activity (user_id, activity_type) VALUES (?, ?)', [user.id, 'login']);
        res.json({ success: true, user: { id: user.id, email: user.email } });
      });
    } else {
      res.status(400).json({ error: 'Invalid type' });
    }
  });
});

// Get seat status for a showtime (only sold seats)
app.get('/api/seats', (req, res) => {
  const { movie, theater, showtime } = req.query;
  if (!movie || !theater || !showtime) {
    return res.status(400).json({ error: 'movie, theater, and showtime are required' });
  }
  
  // Query for sold seats from the seats table
  db.query(
    'SELECT seat_number FROM seats WHERE movie = ? AND theater = ? AND showtime = ? AND status = "sold"',
    [movie, theater, showtime],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      
      let soldSeats = results.map(row => row.seat_number);
      
      // For demo: hardcode some bestseller seats
      const bestsellerSeats = ["B5", "B6", "C7", "D8", "E9", "F10", "G11", "H12"];
      
      // Build seat status array
      const seats = [];
      const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K"];
      const COLS = 18;
      
      for (let r = 0; r < ROWS.length; r++) {
        for (let c = 1; c <= COLS; c++) {
          const id = `${ROWS[r]}${c}`;
          let state = 'available';
          if (soldSeats.includes(id)) {
            state = 'sold';
          } else if (bestsellerSeats.includes(id)) {
            state = 'bestseller';
          }
          seats.push({ id, state });
        }
      }
      
      res.json({ seats });
    }
  );
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 