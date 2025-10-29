import React, { forwardRef } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiHome, 
  FiPackage, 
  FiShoppingCart, 
  FiBell, 
  FiBarChart,
  FiTrendingUp,
  FiSettings
} from 'react-icons/fi';

const Sidebar = forwardRef(({ isOpen }, ref) => {
  const menuItems = [
    {
      path: '/dashboard',
      icon: FiHome,
      label: 'Dashboard',
      exact: true
    },
    {
      path: '/inventory',
      icon: FiPackage,
      label: 'Inventory'
    },
    {
      path: '/orders',
      icon: FiShoppingCart,
      label: 'Orders'
    },
    {
      path: '/notifications',
      icon: FiBell,
      label: 'Notifications'
    },
    {
      path: '/analytics',
      icon: FiBarChart,
      label: 'Analytics'
    },
    {
      path: '/sales',
      icon: FiTrendingUp,
      label: 'Sales'
    },
    {
      path: '/settings',
      icon: FiSettings,
      label: 'Settings'
    }
  ];

  return (
    <aside ref={ref} className={`sidebar ${isOpen ? 'open' : ''}`}>
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                  end={item.exact}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
