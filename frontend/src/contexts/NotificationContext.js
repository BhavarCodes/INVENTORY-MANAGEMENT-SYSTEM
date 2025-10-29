import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import API_BASE_URL, { API_ENDPOINTS } from '../config/api';

let socket;
try {
  socket = io(API_BASE_URL, { transports: ['websocket', 'polling'], withCredentials: true, autoConnect: true });
  socket.on('connect_error', () => {
    // Swallow connection errors in dev; notifications still work via polling
  });
} catch (_e) {
  socket = null;
}

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Fetch notifications
  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    if (!user) {
      return { 
        notifications: [], 
        unreadCount: 0, 
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalNotifications: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    }
    
    try {
      setLoading(true);
  const response = await axios.get(API_ENDPOINTS.NOTIFICATIONS(page, limit));
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
      return response.data;
    } catch (error) {
      console.error('Fetch notifications error:', error);
      toast.error('Failed to fetch notifications');
      return { 
        notifications: [], 
        unreadCount: 0, 
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalNotifications: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
  await axios.put(API_ENDPOINTS.NOTIFICATIONS_MARK_READ(notificationId));
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Mark as read error:', error);
      toast.error('Failed to mark notification as read');
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
  await axios.put(API_ENDPOINTS.NOTIFICATIONS_READ_ALL);
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Mark all as read error:', error);
      toast.error('Failed to mark all notifications as read');
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
  await axios.delete(API_ENDPOINTS.NOTIFICATION(notificationId));
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Delete notification error:', error);
      toast.error('Failed to delete notification');
    }
  }, []);

  // Get unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
  const response = await axios.get(API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Fetch unread count error:', error);
    }
  }, [user]);

  // Show toast notification
  const showNotification = (title, message, type = 'info') => {
    const notificationMessage = `${title}: ${message}`;
    
    switch (type) {
      case 'success':
        toast.success(notificationMessage);
        break;
      case 'error':
        toast.error(notificationMessage);
        break;
      case 'warning':
        toast.warning(notificationMessage);
        break;
      default:
        toast.info(notificationMessage);
    }
  };

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  // Live updates via socket.io
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast.info(notification.message, {
        onClick: () => markAsRead(notification._id),
        autoClose: 5000
      });
    };

    socket.on('newNotification', handleNewNotification);

    return () => {
      socket.off('newNotification', handleNewNotification);
    };
  }, [markAsRead]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchUnreadCount,
    showNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
