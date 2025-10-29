import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set up axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Check if user is logged in on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Set the token in axios headers before making the request
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Use direct connection since proxy is not working reliably
          const response = await axios.get(API_ENDPOINTS.ME);
          
          setUser(response.data.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Frontend: Attempting login for email:', email);
      console.log('Frontend: Making direct request to backend');
      
      // Use direct connection since proxy is not working reliably
      const response = await axios.post(API_ENDPOINTS.LOGIN, { 
        email, 
        password 
      });
      
      console.log('Frontend: Login response received:', response.data);
      
      const { token, user: userData } = response.data;
      
      if (!token || !userData) {
        console.error('Frontend: Invalid response from server - missing token or user data');
        throw new Error('Invalid response from server');
      }
      
      console.log('Frontend: Storing token and setting user data');
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      
      console.log('Frontend: Login successful');
      return { success: true };
    } catch (error) {
      console.error('Frontend: Login error details:', error);
      console.error('Frontend: Error response:', error.response);
      console.error('Frontend: Error request:', error.request);
      
      // Improved error handling with more detailed error messages
      let errorMessage = 'Login failed';
      let requiresVerification = false;
      
      if (error.response) {
        console.log('Frontend: Server responded with error status:', error.response.status);
        console.log('Frontend: Server error data:', error.response.data);
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = error.response.data.message || 
                      (error.response.data.errors && error.response.data.errors[0]?.msg) || 
                      'Login failed';
        requiresVerification = error.response.data.requiresVerification || false;
      } else if (error.request) {
        console.log('Frontend: No response received from server');
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
      } else if (error.message) {
        console.log('Frontend: Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      console.log('Frontend: Returning error message:', errorMessage);
      return { 
        success: false, 
        message: errorMessage,
        requiresVerification
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Frontend: Attempting registration for email:', userData.email);
      console.log('Frontend: Making direct request to backend');
      
      // Use direct connection since proxy is not working reliably
      const response = await axios.post(API_ENDPOINTS.REGISTER, userData);
      
      console.log('Frontend: Registration response received:', response.data);
      
      // Check if email verification is required
      if (response.data.requiresVerification) {
        console.log('Frontend: Email verification required');
        // Don't set user or token, just return success
        return { 
          success: true, 
          requiresVerification: true,
          message: response.data.message 
        };
      }
      
      const { token, user: newUser } = response.data;
      
      if (!token || !newUser) {
        console.error('Frontend: Invalid response from server - missing token or user data');
        throw new Error('Invalid response from server');
      }
      
      console.log('Frontend: Storing token and setting user data');
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(newUser);
      
      console.log('Frontend: Registration successful');
      return { success: true };
    } catch (error) {
      console.error('Frontend: Registration error details:', error);
      console.error('Frontend: Error response:', error.response);
      console.error('Frontend: Error request:', error.request);
      
      // Improved error handling with more detailed error messages
      let errorMessage = 'Registration failed';
      
      if (error.response) {
        console.log('Frontend: Server responded with error status:', error.response.status);
        console.log('Frontend: Server error data:', error.response.data);
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = error.response.data.message || 
                      (error.response.data.errors && error.response.data.errors[0]?.msg) || 
                      'Registration failed';
      } else if (error.request) {
        console.log('Frontend: No response received from server');
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
      } else if (error.message) {
        console.log('Frontend: Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      console.log('Frontend: Returning error message:', errorMessage);
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/api/auth/profile', profileData);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Profile update failed' 
      };
    }
  };

  // Method to manually set user data (for OAuth callbacks)
  const setUserData = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    setUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
