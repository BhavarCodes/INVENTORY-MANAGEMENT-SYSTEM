import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const BusinessContext = createContext();

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};

export const BusinessProvider = ({ children }) => {
  const [currentBusiness, setCurrentBusiness] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load user's businesses
  const loadBusinesses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Set the token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
  const response = await axios.get(API_ENDPOINTS.BUSINESSES);

      setBusinesses(response.data.businesses);
      
      // Set current business if not already set
      if (!currentBusiness && response.data.businesses.length > 0) {
        setCurrentBusiness(response.data.businesses[0]);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
      // If unauthorized, clear token and redirect to login
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      }
    } finally {
      setLoading(false);
    }
  }, [currentBusiness]);

  // Switch to a different business
  const switchBusiness = async (businessId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, message: 'No authentication token' };

      // Set the token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const response = await axios.put(API_ENDPOINTS.SWITCH_BUSINESS(businessId), {});

      setCurrentBusiness(response.data.business);
      return { success: true, business: response.data.business };
    } catch (error) {
      console.error('Error switching business:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to switch business' };
    }
  };

  // Create a new business
  const createBusiness = async (businessData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, message: 'No authentication token' };

      // Set the token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const response = await axios.post(API_ENDPOINTS.BUSINESS(''), businessData);

      const newBusiness = response.data.business;
      setBusinesses(prev => [...prev, newBusiness]);
      setCurrentBusiness(newBusiness);

      return { success: true, business: newBusiness };
    } catch (error) {
      console.error('Error creating business:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to create business' 
      };
    }
  };

  // Set current business from user data
  const setCurrentBusinessFromUser = (userData) => {
    if (userData.currentBusiness) {
      setCurrentBusiness(userData.currentBusiness);
    }
    if (userData.businesses) {
      setBusinesses(userData.businesses.map(b => b.business));
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const value = {
    currentBusiness,
    businesses,
    loading,
    switchBusiness,
    createBusiness,
    setCurrentBusinessFromUser,
    loadBusinesses
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};
