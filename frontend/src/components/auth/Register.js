import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...userData } = formData;
      const result = await register(userData);
      
      if (result.success) {
        setRegistrationSuccess(true);
        toast.success('Registration successful! Please check your email to verify your account.');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  // If registration was successful, show verification message
  if (registrationSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>📧 Check Your Email</h1>
          </div>

          <div className="auth-form" style={{ textAlign: 'center', padding: '30px' }}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>✉️</div>
            <h2 style={{ color: '#667eea', marginBottom: '15px' }}>
              Registration Successful!
            </h2>
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>
              We've sent a verification email to:
            </p>
            <p style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: '#333',
              background: '#f8f9fa',
              padding: '10px',
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              {formData.email}
            </p>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Please click the verification link in the email to activate your account.
            </p>
            <div style={{ 
              background: '#fff3cd',
              border: '1px solid #ffc107',
              padding: '15px',
              borderRadius: '5px',
              marginTop: '20px',
              marginBottom: '20px'
            }}>
              <p style={{ fontSize: '13px', color: '#856404', margin: 0 }}>
                ⚠️ <strong>Note:</strong> The verification link will expire in 24 hours.
                Don't forget to check your spam folder if you don't see the email.
              </p>
            </div>
            <Link to="/login" className="btn btn-primary" style={{ 
              display: 'inline-block',
              textDecoration: 'none',
              padding: '12px 30px'
            }}>
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Grocery Inventory Management</h1>
          <p>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-control"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-control"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-control"
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
              required
              disabled={loading}
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-control"
              required
              disabled={loading}
              minLength="6"
            />
          </div>

          <div className="address-section">
            <h4>Address (Optional)</h4>
            
            <div className="form-group">
              <label htmlFor="street" className="form-label">Street Address</label>
              <input
                type="text"
                id="street"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                className="form-control"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="city" className="form-label">City</label>
              <input
                type="text"
                id="city"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                className="form-control"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="state" className="form-label">State</label>
              <input
                type="text"
                id="state"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                className="form-control"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="zipCode" className="form-label">ZIP Code</label>
              <input
                type="text"
                id="zipCode"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleChange}
                className="form-control"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="country" className="form-label">Country</label>
              <input
                type="text"
                id="country"
                name="address.country"
                value={formData.address.country}
                onChange={handleChange}
                className="form-control"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
