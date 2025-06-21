import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const RESEND_COOLDOWN = 30; // seconds

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: email, 2: otp
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  React.useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'signup' })
      });
      const data = await res.json();
      if (data.success) {
        setStep(2);
        setResendMsg('');
        setResendCooldown(RESEND_COOLDOWN);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Server error');
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setError('');
    setResendMsg('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'signup' })
      });
      const data = await res.json();
      if (data.success) {
        setResendMsg('OTP resent to your email.');
        setResendCooldown(RESEND_COOLDOWN);
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Server error');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, type: 'signup' })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/'), 1500);
      } else {
        setError(data.error || 'OTP verification failed');
      }
    } catch (err) {
      setError('Server error');
    }
    setLoading(false);
  };

  return (
    <div className="classic-login-bg">
      <div className="classic-login-card">
        <div className="classic-login-header">
          <img src={process.env.PUBLIC_URL + '/img/logo.jpg'} alt="Logo" className="classic-login-logo" />
          <h1 className="classic-login-title">Create Account</h1>
          <p className="classic-login-subtitle">Sign up to book your movie tickets</p>
        </div>
        <div className="classic-login-body">
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="classic-login-form">
              <div className="classic-login-label">Email Address</div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="classic-login-input"
                placeholder="you@example.com"
              />
              {error && <div className="classic-login-error">{error}</div>}
              <button
                type="submit"
                disabled={loading}
                className="classic-login-btn"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="classic-login-form">
              <div className="classic-login-label">Enter OTP sent to your email</div>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                maxLength={6}
                className="classic-login-input"
                placeholder="Enter 6-digit OTP"
              />
              {error && <div className="classic-login-error">{error}</div>}
              {resendMsg && <div className="classic-login-success">{resendMsg}</div>}
              {success && <div className="classic-login-success">Account created! Redirecting...</div>}
              <button
                type="submit"
                disabled={loading}
                className="classic-login-btn"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
                className="classic-login-btn-outline"
              >
                {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
              </button>
            </form>
          )}
          <div className="mt-6 text-center">
            <button
              className="classic-login-link"
              onClick={() => navigate('/')}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup; 