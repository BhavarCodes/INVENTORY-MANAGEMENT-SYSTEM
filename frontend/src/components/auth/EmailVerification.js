import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_ENDPOINTS } from '../../config/api';
import './Login.css';

const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);

  const verifyEmail = useCallback(async (verificationToken) => {
    try {
      const response = await fetch(API_ENDPOINTS.VERIFY_EMAIL(verificationToken));
      const data = await response.json();

      if (response.ok) {
        setVerificationStatus('success');
        setMessage(data.message);
        toast.success('Email verified successfully! Redirecting to login...');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setVerificationStatus('error');
        setMessage(data.message || 'Failed to verify email. The link may be expired or invalid.');
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
      setMessage('An error occurred during verification. Please try again.');
      toast.error('Verification failed. Please try again.');
    }
  }, [navigate]);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token, verifyEmail]);

  const handleResendVerification = async (e) => {
    e.preventDefault();
    
    if (!resendEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setResending(true);

    try {
      const response = await fetch(API_ENDPOINTS.RESEND_VERIFICATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setResendEmail('');
      } else {
        toast.error(data.message || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>📧 Email Verification</h1>
        </div>

        <div className="auth-form" style={{ textAlign: 'center', padding: '30px' }}>
          {verificationStatus === 'verifying' && (
            <>
              <div className="spinner" style={{ 
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              <p style={{ fontSize: '18px', color: '#666' }}>
                Verifying your email address...
              </p>
            </>
          )}

          {verificationStatus === 'success' && (
            <>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>✅</div>
              <h2 style={{ color: '#28a745', marginBottom: '15px' }}>
                Email Verified Successfully!
              </h2>
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>
                {message}
              </p>
              <p style={{ fontSize: '14px', color: '#999' }}>
                Redirecting you to login page...
              </p>
              <Link to="/login" className="btn btn-primary" style={{ 
                display: 'inline-block', 
                marginTop: '20px',
                padding: '10px 30px',
                textDecoration: 'none'
              }}>
                Go to Login
              </Link>
            </>
          )}

          {verificationStatus === 'error' && (
            <>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>❌</div>
              <h2 style={{ color: '#dc3545', marginBottom: '15px' }}>
                Verification Failed
              </h2>
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
                {message}
              </p>

              <div style={{ 
                background: '#f8f9fa', 
                padding: '25px', 
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                marginTop: '20px'
              }}>
                <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#333' }}>
                  Request New Verification Email
                </h3>
                <form onSubmit={handleResendVerification}>
                  <div className="form-group" style={{ textAlign: 'left' }}>
                    <label htmlFor="resendEmail" className="form-label">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="resendEmail"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="form-control"
                      placeholder="Enter your email"
                      required
                      disabled={resending}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={resending}
                    style={{ marginTop: '10px' }}
                  >
                    {resending ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </form>
              </div>

              <Link to="/login" className="auth-link" style={{ 
                display: 'inline-block', 
                marginTop: '20px',
                fontSize: '14px'
              }}>
                ← Back to Login
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EmailVerification;
