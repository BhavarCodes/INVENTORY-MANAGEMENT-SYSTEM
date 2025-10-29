import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  // Start with sidebar open on desktop, closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const sidebarRef = useRef(null);

  const handleMenuToggle = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleOverlayClick = () => {
    setIsSidebarOpen(false);
  };

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest('.menu-toggle')
      ) {
        setIsSidebarOpen(false);
      }
    };

    // Close sidebar on escape key
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isSidebarOpen]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        // On desktop, keep sidebar open by default
        setIsSidebarOpen(true);
      } else {
        // On mobile, close sidebar by default
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen && window.innerWidth <= 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  return (
    <div className={`layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && window.innerWidth <= 1024 && (
        <div 
          className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
          onClick={handleOverlayClick}
        />
      )}
      
      <Sidebar isOpen={isSidebarOpen} ref={sidebarRef} />
      
      <div className="main-content">
        <Header onMenuToggle={handleMenuToggle} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
