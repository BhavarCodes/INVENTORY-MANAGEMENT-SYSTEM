import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { toast } from 'react-toastify';
import { FcGoogle } from 'react-icons/fc';
import { FiPackage, FiBarChart2, FiTrendingUp, FiShield, FiBell, FiUsers } from 'react-icons/fi';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, setUserData } = useAuth();
  const { setCurrentBusinessFromUser } = useBusiness();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGoogleCallback = useCallback(async (token) => {
    try {
      localStorage.setItem('token', token);
      
      // Set the token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch user data
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        setCurrentBusinessFromUser(data.user);
        toast.success('Login successful!');
        
        // Small delay to ensure state is updated, then redirect
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch user data');
      }
    } catch (error) {
      console.error('Google callback error:', error);
      toast.error(error.message || 'Authentication failed. Please try again.');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [navigate, setUserData, setCurrentBusinessFromUser]);

  // Handle Google OAuth callback
  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    
    if (token) {
      handleGoogleCallback(token);
    } else if (error) {
      toast.error('Google authentication failed. Please try again.');
    }
  }, [searchParams, handleGoogleCallback]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        toast.success('Login successful!');
      } else {
        // Show appropriate error message
        if (result.requiresVerification) {
          toast.error(result.message, { autoClose: 7000 }); // Show longer for email verification message
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      toast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Use the full URL to avoid React Router interference
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-text">
              <h1 className="hero-title">
                Engineered to handle all your{' '}
                <span className="highlight">inventory needs</span>
              </h1>
              <p className="hero-description">
                Your complete inventory management software to track inventory, 
                streamline sales, fulfill orders, and oversee warehouses from a single window.
              </p>
              
              {/* Features Grid */}
              <div className="features-grid">
                <div className="feature-item">
                  <FiPackage className="feature-icon" />
                  <span>Inventory Tracking</span>
                </div>
                <div className="feature-item">
                  <FiBarChart2 className="feature-icon" />
                  <span>Sales Analytics</span>
                </div>
                <div className="feature-item">
                  <FiTrendingUp className="feature-icon" />
                  <span>Stock Automation</span>
                </div>
                <div className="feature-item">
                  <FiBell className="feature-icon" />
                  <span>Real-time Alerts</span>
                </div>
                <div className="feature-item">
                  <FiShield className="feature-icon" />
                  <span>Secure & Reliable</span>
                </div>
                <div className="feature-item">
                  <FiUsers className="feature-icon" />
                  <span>Multi-user Support</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="login-card">
              <div className="login-header">
                <h2>Sign in to your account</h2>
                <p>Access your inventory dashboard</p>
              </div>

              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="btn btn-google w-100"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <FcGoogle size={20} />
                Continue with Google
              </button>

              <div className="auth-footer">
                <p>
                  Don't have an account?{' '}
                  <Link to="/register" className="auth-link">
                    Sign up here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <div className="container">
          <h2 className="section-title">Everything you need to manage your inventory</h2>
          <div className="features-list">
            <div className="feature-card">
              <div className="feature-card-icon">
                <FiPackage />
              </div>
              <h3>Smart Inventory Management</h3>
              <p>Track stock levels, manage products, and get real-time updates on your inventory across multiple locations.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-card-icon">
                <FiTrendingUp />
              </div>
              <h3>Automated Reordering</h3>
              <p>Set minimum stock levels and let the system automatically create orders when inventory runs low.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-card-icon">
                <FiBarChart2 />
              </div>
              <h3>Advanced Analytics</h3>
              <p>Get insights into your business with detailed reports, analytics, and performance metrics.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-card-icon">
                <FiBell />
              </div>
              <h3>Real-time Notifications</h3>
              <p>Stay informed with instant alerts for low stock, order updates, and important business events.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
