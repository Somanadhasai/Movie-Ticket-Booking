import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CreditCard, User, Calendar, Shield, Check, AlertCircle, Smartphone, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { movie, theaterName, showtime, selectedSeats, totalAmount, lockedSeats } = location.state || {};
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [upiError, setUpiError] = useState("");
  const [upiId, setUpiId] = useState("");
  const [upiPaid, setUpiPaid] = useState(false);
  const [upiRequestSent, setUpiRequestSent] = useState(false);
  const [emailForConfirmation, setEmailForConfirmation] = useState('');
  
  // Seat locking state
  const [lockTimer, setLockTimer] = useState(600); // 10 minutes in seconds
  const [isLockExpired, setIsLockExpired] = useState(false);

  const orderSummary = {
    items: [
      { name: 'Movie Ticket(s)', price: totalAmount || 0 },
    ],
    subtotal: totalAmount || 0,
    tax: 0,
    total: totalAmount || 0
  };

  // Countdown timer for seat lock
  useEffect(() => {
    if (lockTimer <= 0) {
      setIsLockExpired(true);
      return;
    }

    const interval = setInterval(() => {
      setLockTimer(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [lockTimer]);

  // Release locks when component unmounts or user navigates away
  useEffect(() => {
    const handleBeforeUnload = () => {
      releaseSeatLocks();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      releaseSeatLocks();
    };
  }, []);

  const releaseSeatLocks = async () => {
    if (!selectedSeats || selectedSeats.length === 0) return;
    
    try {
      const email = getUserEmail();
      await fetch('/api/release-locks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movie: movie?.title,
          theater: theaterName,
          showtime,
          seats: selectedSeats,
          email
        })
      });
    } catch (error) {
      console.error('Error releasing locks:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getUserEmail = () => {
    // Try to get email from localStorage/session (if stored on login)
    let email = localStorage.getItem('userEmail');
    if (!email) {
      email = window.prompt('Enter your email for booking confirmation:');
      if (email) localStorage.setItem('userEmail', email);
    }
    return email;
  };

  const onSubmit = async (data) => {
    setIsProcessing(true);
    try {
      const email = getUserEmail();
      const response = await fetch('http://localhost:5000/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardNumber: data.cardNumber,
          cardName: data.cardName,
          expiryDate: data.expiryDate,
          cvv: data.cvv,
          amount: orderSummary.total,
          email,
          movie: movie?.title,
          theaterName,
          showtime,
          selectedSeats
        })
      });
      const result = await response.json();
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        alert('Payment failed: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Payment failed: ' + err.message);
    }
    setIsProcessing(false);
  };

  const handleUpiPayment = async () => {
    setUpiError("");
    
    // Validate UPI ID format
    if (!upiId.trim()) {
      setUpiError("Please enter your UPI ID");
      return;
    }
    
    // Basic UPI ID validation (username@provider format)
    if (!upiId.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/)) {
      setUpiError("Please enter a valid UPI ID (e.g. username@paytm, username@phonepe)");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const email = getUserEmail();
      
      // Send payment request to the UPI ID
      const response = await fetch('http://localhost:5000/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upiId: upiId.trim(),
          amount: orderSummary.total,
          method: 'upi',
          email,
          movie: movie?.title,
          theaterName,
          showtime,
          selectedSeats
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Payment request sent successfully
        setUpiPaid(true);
        setIsSuccess(true);
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        
        // Show success message and redirect
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setUpiError(result.error || 'Failed to send payment request. Please try again.');
      }
    } catch (err) {
      setUpiError('Network error. Please check your connection and try again.');
    }
    
    setIsProcessing(false);
    setUpiRequestSent(true);
  };

  const formatCardNumber = (value) => {
    return value
      .replace(/\s/g, '')
      .replace(/(\d{4})/g, '$1 ')
      .trim();
  };

  // Handle lock expiration
  if (isLockExpired) {
    return (
      <div className="classic-login-bg">
        <div className="classic-login-card">
          <div className="classic-login-header">
            <h1 className="classic-login-title">Seat Lock Expired!</h1>
            <p className="classic-login-subtitle">Your seat reservation has expired</p>
          </div>
          <div className="classic-login-body">
            <p className="classic-login-error">
              Please select your seats again.
            </p>
            <button
              onClick={() => navigate('/seat-selection', { state: { movie, theaterName, showtime } })}
              className="classic-login-btn"
            >
              Select Seats Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess && paymentMethod === 'upi' && !upiPaid) {
    return (
      <div className="classic-login-bg">
        <div className="classic-login-card">
          <div className="classic-login-header">
            <h1 className="classic-login-title">Payment Request Sent!</h1>
            <p className="classic-login-subtitle">Check your UPI app</p>
          </div>
          <div className="classic-login-body">
            <p className="classic-login-success">
              UPI payment request has been sent to {upiId}. Please check your UPI app and complete the payment to confirm your booking.
            </p>
            <button
              onClick={async () => {
                setIsProcessing(true);
                // Call backend to send ticket confirmation email
                const email = getUserEmail();
                const response = await fetch('http://localhost:5000/api/send-ticket', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email,
                    movie: movie?.title,
                    theaterName,
                    showtime,
                    selectedSeats
                  })
                });
                setIsProcessing(false);
                setUpiPaid(true);
              }}
              className="classic-login-btn"
              disabled={isProcessing}
            >
              {isProcessing ? 'Sending Ticket...' : 'I have paid'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess && paymentMethod === 'upi' && upiPaid) {
    return (
      <div className="classic-login-bg">
        <div className="classic-login-card">
          <div className="classic-login-header">
            <h1 className="classic-login-title">Ticket Sent!</h1>
            <p className="classic-login-subtitle">Enjoy your movie!</p>
          </div>
          <div className="classic-login-body">
            <p className="classic-login-success">
              Your movie ticket details have been sent to your email.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="classic-login-btn"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="classic-login-bg">
      <div className="classic-login-card" style={{maxWidth: 520}}>
        <div className="classic-login-header">
          <h1 className="classic-login-title">Secure Checkout</h1>
          <p className="classic-login-subtitle">Complete your purchase securely</p>
        </div>
        <div className="classic-login-body">
          {/* Booking Details Display */}
          {(movie || theaterName || showtime || selectedSeats) && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 border border-blue-100 dark:border-blue-800">
              <h2 className="text-lg font-semibold mb-2">Booking Details</h2>
              {movie && <div><strong>Movie:</strong> {movie.title}</div>}
              {theaterName && <div><strong>Theater:</strong> {theaterName}</div>}
              {showtime && <div><strong>Showtime:</strong> {showtime}</div>}
              {selectedSeats && selectedSeats.length > 0 && (
                <div><strong>Seats:</strong> {selectedSeats.join(", ")}</div>
              )}
            </div>
          )}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-all hover:shadow-xl">
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Payment Form */}
                <div className="md:col-span-2">
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Payment Method</h2>
                    <div className="flex space-x-4 mb-6">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`classic-login-btn${paymentMethod === 'card' ? '' : ' classic-login-btn-outline'}`}
                      >
                        <CreditCard size={18} className="mr-2" />
                        Credit Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('paypal')}
                        className={`classic-login-btn${paymentMethod === 'paypal' ? '' : ' classic-login-btn-outline'}`}
                      >
                        <span className="font-bold">Pay</span>
                        <span className="font-bold" style={{ color: '#23395d' }}>Pal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('apple')}
                        className={`classic-login-btn${paymentMethod === 'apple' ? '' : ' classic-login-btn-outline'}`}
                      >
                        <span className="font-medium">Apple Pay</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi')}
                        className={`classic-login-btn${paymentMethod === 'upi' ? '' : ' classic-login-btn-outline'}`}
                      >
                        <Smartphone size={18} className="mr-2" />
                        UPI
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'card' && (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      <div>
                        <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Card Number
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <CreditCard size={18} className="text-gray-400" />
                          </div>
                          <input
                            id="cardNumber"
                            type="text"
                            {...register('cardNumber', { 
                              required: 'Card number is required',
                              pattern: {
                                value: /^[\d\s]{16,19}$/,
                                message: 'Invalid card number'
                              },
                              onChange: (e) => {
                                e.target.value = formatCardNumber(e.target.value);
                              }
                            })}
                            maxLength={19}
                            className="block w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 transition-all duration-200"
                            placeholder="1234 5678 9012 3456"
                          />
                        </div>
                        {errors.cardNumber && (
                          <div className="mt-1 flex items-center text-sm text-red-500">
                            <AlertCircle size={16} className="mr-1" />
                            {errors.cardNumber.message}
                          </div>
                        )}
                      </div>

                      <div>
                        <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cardholder Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User size={18} className="text-gray-400" />
                          </div>
                          <input
                            id="cardName"
                            type="text"
                            {...register('cardName', { 
                              required: 'Cardholder name is required'
                            })}
                            className="block w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 transition-all duration-200"
                            placeholder="John Smith"
                          />
                        </div>
                        {errors.cardName && (
                          <div className="mt-1 flex items-center text-sm text-red-500">
                            <AlertCircle size={16} className="mr-1" />
                            {errors.cardName.message}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Expiry Date
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Calendar size={18} className="text-gray-400" />
                            </div>
                            <input
                              id="expiryDate"
                              type="text"
                              {...register('expiryDate', { 
                                required: 'Expiry date is required',
                                pattern: {
                                  value: /^(0[1-9]|1[0-2])\/\d{2}$/,
                                  message: 'Format should be MM/YY'
                                }
                              })}
                              className="block w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 transition-all duration-200"
                              placeholder="MM/YY"
                              maxLength={5}
                            />
                          </div>
                          {errors.expiryDate && (
                            <div className="mt-1 flex items-center text-sm text-red-500">
                              <AlertCircle size={16} className="mr-1" />
                              {errors.expiryDate.message}
                            </div>
                          )}
                        </div>
                        <div>
                          <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            CVV
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Shield size={18} className="text-gray-400" />
                            </div>
                            <input
                              id="cvv"
                              type="text"
                              {...register('cvv', { 
                                required: 'CVV is required',
                                pattern: {
                                  value: /^\d{3,4}$/,
                                  message: 'CVV must be 3 or 4 digits'
                                }
                              })}
                              className="block w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 transition-all duration-200"
                              placeholder="123"
                              maxLength={4}
                            />
                          </div>
                          {errors.cvv && (
                            <div className="mt-1 flex items-center text-sm text-red-500">
                              <AlertCircle size={16} className="mr-1" />
                              {errors.cvv.message}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="save-card"
                          type="checkbox"
                          {...register('saveCard')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="save-card" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Save this card for future payments
                        </label>
                      </div>

                      <div>
                        <button
                          type="submit"
                          disabled={isSubmitting || isProcessing}
                          className="classic-login-btn"
                        >
                          {isProcessing ? (
                            <>
                              <div className="animate-spin -ml-1 mr-2 h-4 w-4 text-white rounded-full border-2 border-white border-t-transparent" />
                              Processing Payment...
                            </>
                          ) : (
                            <>
                              Pay ₹{orderSummary.total.toFixed(2)}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {paymentMethod === 'paypal' && (
                    <div className="text-center py-10">
                      <p className="text-gray-600 dark:text-gray-400 mb-6">Click the button below to complete payment with PayPal.</p>
                      <button
                        onClick={() => {
                          setIsProcessing(true);
                          setTimeout(() => {
                            setIsProcessing(false);
                            setIsSuccess(true);
                          }, 2000);
                        }}
                        disabled={isProcessing}
                        className="classic-login-btn"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin -ml-1 mr-2 h-4 w-4 text-white rounded-full border-2 border-white border-t-transparent" />
                            Processing...
                          </>
                        ) : (
                          'Continue with PayPal'
                        )}
                      </button>
                    </div>
                  )}

                  {paymentMethod === 'apple' && (
                    <div className="text-center py-10">
                      <p className="text-gray-600 dark:text-gray-400 mb-6">Click the button below to pay with Apple Pay.</p>
                      <button
                        onClick={() => {
                          setIsProcessing(true);
                          setTimeout(() => {
                            setIsProcessing(false);
                            setIsSuccess(true);
                          }, 2000);
                        }}
                        disabled={isProcessing}
                        className="classic-login-btn"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin -ml-1 mr-2 h-4 w-4 text-white rounded-full border-2 border-white border-t-transparent" />
                            Processing...
                          </>
                        ) : (
                          'Pay with Apple Pay'
                        )}
                      </button>
                    </div>
                  )}

                  {paymentMethod === 'upi' && !upiRequestSent && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <div style={{fontWeight: 600, fontSize: '1.1rem', color: '#2563eb', marginBottom: 8}}>
                          Amount to Pay: <span style={{color: '#1e40af'}}>₹{orderSummary.total}</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Enter your UPI ID below to receive a payment request
                        </p>
                      </div>
                      
                      <form onSubmit={handleUpiPayment} className="space-y-4">
                        <div>
                          <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            UPI ID
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Smartphone size={18} className="text-gray-400" />
                            </div>
                            <input
                              id="upiId"
                              type="text"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              className="block w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 transition-all duration-200"
                              placeholder="username@bank"
                              required
                            />
                          </div>
                          {upiError && (
                            <div className="mt-1 flex items-center text-sm text-red-500">
                              <AlertCircle size={16} className="mr-1" />
                              {upiError}
                            </div>
                          )}
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Example: username@paytm, username@phonepe, username@googlepay
                          </p>
                        </div>
                        
                        <button
                          type="submit"
                          disabled={isProcessing || !upiId.trim()}
                          className="classic-login-btn"
                        >
                          {isProcessing ? (
                            <>
                              <div className="animate-spin -ml-1 mr-2 h-4 w-4 text-white rounded-full border-2 border-white border-t-transparent" />
                              Sending Payment Request...
                            </>
                          ) : (
                            'Send Payment Request'
                          )}
                        </button>
                      </form>
                    </div>
                  )}

                  {paymentMethod === 'upi' && upiRequestSent && (
                    <div>
                      <p>Enter your email to receive booking confirmation:</p>
                      <input
                        type="email"
                        value={emailForConfirmation}
                        onChange={e => setEmailForConfirmation(e.target.value)}
                        placeholder="Enter your email"
                      />
                      <button
                        onClick={async () => {
                          setIsProcessing(true);
                          await fetch('http://localhost:5000/api/send-ticket', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              email: emailForConfirmation,
                              movie: movie?.title,
                              theaterName,
                              showtime,
                              selectedSeats
                            })
                          });
                          setIsProcessing(false);
                          // Optionally show a success message here
                        }}
                        disabled={isProcessing || !emailForConfirmation}
                      >
                        {isProcessing ? 'Processing...' : 'Confirm Booking'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <div className="md:col-span-1">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Order Summary</h2>
                    
                    <div className="space-y-4 mb-6">
                      {orderSummary.items.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                          <span className="text-gray-900 dark:text-white font-medium">₹{item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
                        <span className="text-gray-900 dark:text-white font-medium">₹{orderSummary.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Tax</span>
                        <span className="text-gray-900 dark:text-white font-medium">₹{orderSummary.tax.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <div className="flex justify-between">
                        <span className="text-gray-900 dark:text-white font-medium">Total</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">₹{orderSummary.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
                    <div className="flex">
                      <Shield className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Secure Payment</h3>
                        <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                          Your payment information is encrypted and secure. We never store your full card details.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;