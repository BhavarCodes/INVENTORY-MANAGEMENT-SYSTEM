import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { useNotification } from '../../contexts/NotificationContext';
import { FiBell, FiUser, FiLogOut, FiMenu, FiChevronDown, FiHome } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

const Header = ({ onMenuToggle }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBusinessMenu, setShowBusinessMenu] = useState(false);
  const { user, logout } = useAuth();
  const { currentBusiness, businesses, switchBusiness } = useBusiness();
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);
  const businessMenuRef = useRef(null);
  const { unreadCount, fetchNotifications, notifications, markAsRead, markAllAsRead } = useNotification();

  const handleMenuToggle = () => {
    onMenuToggle();
  };

  const handleLogout = () => {
    logout();
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleBusinessSwitch = async (businessId) => {
    const result = await switchBusiness(businessId);
    if (result.success) {
      setShowBusinessMenu(false);
      toast.success('Business switched successfully');
    } else {
      toast.error(result.message);
    }
  };

  // Close dropdowns on route change
  useEffect(() => {
    setShowUserMenu(false);
    setShowNotifications(false);
    setShowBusinessMenu(false);
  }, [location.pathname]);

  // Close when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (businessMenuRef.current && !businessMenuRef.current.contains(e.target)) {
        setShowBusinessMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <header className="header">
      <div className="header-left">
        <button 
          className="menu-toggle" 
          onClick={handleMenuToggle}
          title="Toggle sidebar"
        >
          <FiMenu size={20} />
        </button>
        <h1 className="header-title">Grocery Inventory Management</h1>
      </div>

      <div className="header-right">
        {/* Business Switcher */}
        {businesses.length > 1 && (
          <div className="business-dropdown" ref={businessMenuRef}>
            <button
              className="business-btn"
              onClick={() => setShowBusinessMenu(!showBusinessMenu)}
            >
              <FiHome size={16} />
              <span>{currentBusiness?.name || 'Select Business'}</span>
              <FiChevronDown size={14} />
            </button>

            {showBusinessMenu && (
              <div className="business-menu">
                <div className="business-menu-header">
                  <h4>Switch Business</h4>
                </div>
                <div className="business-menu-items">
                  {businesses.map((business) => (
                    <button
                      key={business._id}
                      className={`business-menu-item ${currentBusiness?._id === business._id ? 'active' : ''}`}
                      onClick={() => handleBusinessSwitch(business._id)}
                    >
                      <FiHome size={16} />
                      <div>
                        <div className="business-name">{business.name}</div>
                        <div className="business-type">{business.businessType}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        <div className="notification-dropdown" ref={notifRef}>
          <button 
            className="notification-btn"
            onClick={handleNotificationClick}
          >
            <FiBell size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-panel">
              <div className="notification-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark All Read
                  </button>
                )}
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <p className="no-notifications">No notifications</p>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification._id}
                      className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                      onClick={() => handleMarkAsRead(notification._id)}
                    >
                      <div className="notification-content">
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                        <small>{new Date(notification.createdAt).toLocaleString()}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark/Light Mode Toggle */}
        <button
          className="theme-toggle-btn"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          onClick={() => setDarkMode((prev) => !prev)}
          style={{ marginLeft: '1.5rem', marginRight: '0.5rem', fontSize: 20, background: 'none', border: 'none', boxShadow: 'none', outline: 'none' }}
        >
          {darkMode ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>
          )}
        </button>

        {/* User Menu */}
        <div className="user-dropdown" ref={userMenuRef}>
          <button 
            className="user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <FiUser size={20} />
            <span>{user?.name}</span>
          </button>

          {showUserMenu && (
            <div className="user-menu">
              <div className="user-info">
                <h4>{user?.name}</h4>
                <p>{user?.email}</p>
              </div>
              <div className="user-menu-items">
                <button className="user-menu-item" onClick={() => { setShowUserMenu(false); navigate('/profile'); }}>
                  <FiUser size={16} />
                  Profile
                </button>
                <button className="user-menu-item" onClick={handleLogout}>
                  <FiLogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
