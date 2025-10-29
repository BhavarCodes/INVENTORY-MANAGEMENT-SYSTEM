import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setCurrentBusinessFromUser } = useBusiness();
  const { setUserData } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');
      
      if (token) {
        try {
          localStorage.setItem('token', token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch user data using direct connection
          const response = await axios.get('http://localhost:5000/api/auth/me');
          
          if (response.data && response.data.user) {
            setUserData(response.data.user);
            setCurrentBusinessFromUser(response.data.user);
            toast.success('Login successful!');
            
            // Small delay to ensure state is updated, then redirect
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 100);
          } else {
            throw new Error('Failed to fetch user data');
          }
        } catch (error) {
          console.error('Auth callback error:', error);
          toast.error('Authentication failed. Please try again.');
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          navigate('/login');
        }
      } else if (error) {
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
      } else {
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, setCurrentBusinessFromUser, setUserData]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Authenticating...</h1>
          <p>Please wait while we complete your sign-in</p>
        </div>
        <div className="loading-spinner"></div>
      </div>
    </div>
  );
};

export default AuthCallback;
