import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiTrash2, FiCheck, FiCreditCard } from 'react-icons/fi';
import { useNotification } from '../../contexts/NotificationContext';
import ConfirmationModal from '../common/ConfirmationModal';

const Notifications = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotification();

  const [filters, setFilters] = useState({
    type: '',
    isRead: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalNotifications: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Local state for confirmation modal
  const [confirmState, setConfirmState] = useState({
    open: false,
    notificationId: null,
  });

  useEffect(() => {
    fetchNotificationsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.currentPage]);

  const fetchNotificationsData = async () => {
    const data = await fetchNotifications(pagination.currentPage, 20, filters);
    if (data && data.pagination) {
      setPagination(data.pagination);
    } else {
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalNotifications: 0,
        hasNext: false,
        hasPrev: false,
      });
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
    fetchNotificationsData();
  };

  const handleDelete = (notificationId) => {
    setConfirmState({ open: true, notificationId });
  };

  const handleConfirmDelete = async () => {
    if (!confirmState.notificationId) return;
    await deleteNotification(confirmState.notificationId);
    setConfirmState({ open: false, notificationId: null });
    fetchNotificationsData();
  };

  const handleCancelDelete = () => {
    setConfirmState({ open: false, notificationId: null });
  };

  const handlePayNow = (notification) => {
    if (notification.data && notification.data.orderId) {
      navigate(`/payment/${notification.data.orderId}`);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'low_stock':
        return 'warning';
      case 'out_of_stock':
        return 'danger';
      case 'order_placed':
        return 'info';
      case 'order_delivered':
        return 'success';
      case 'system_alert':
        return 'secondary';
      case 'reminder':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  const getTypeText = (type) => {
    return type.replace('_', ' ').toUpperCase();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  return (
    <div className="notifications">
      <div className="notifications-header">
        <div className="header-left">
          <h1>Notifications</h1>
          <p>Manage your system notifications</p>
        </div>
        <div className="header-right">
          {unreadCount > 0 && (
            <button className="btn btn-primary" onClick={markAllAsRead}>
              <FiCheck size={16} />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="card">
          <div className="card-body">
            <div className="filters-grid">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="form-control"
                >
                  <option value="">All Types</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="order_placed">Order Placed</option>
                  <option value="order_delivered">Order Delivered</option>
                  <option value="system_alert">System Alert</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  name="isRead"
                  value={filters.isRead}
                  onChange={handleFilterChange}
                  className="form-control"
                >
                  <option value="">All Status</option>
                  <option value="false">Unread</option>
                  <option value="true">Read</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="notifications-section">
        <div className="card">
          <div className="card-header">
            <h3>
              Notifications ({pagination?.totalNotifications || 0})
              {unreadCount > 0 && (
                <span className="unread-count">({unreadCount} unread)</span>
              )}
            </h3>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center">
                <div className="loading-spinner"></div>
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="empty-state">
                <FiBell size={48} className="empty-icon" />
                <h3>No notifications found</h3>
                <p>You're all caught up! New notifications will appear here.</p>
              </div>
            ) : (
              <>
                <div className="notifications-list">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`notification-item ${
                        !notification.isRead ? 'unread' : ''
                      }`}
                    >
                      <div className="notification-content">
                        <div className="notification-header">
                          <h4>{notification.title}</h4>
                          <div className="notification-badges">
                            <span
                              className={`badge badge-${getTypeColor(
                                notification.type
                              )}`}
                            >
                              {getTypeText(notification.type)}
                            </span>
                            <span
                              className={`badge badge-${getPriorityColor(
                                notification.priority
                              )}`}
                            >
                              {notification.priority.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <p className="notification-message">
                          {notification.message}
                        </p>

                        <div className="notification-meta">
                          <small className="text-muted">
                            {new Date(notification.createdAt).toLocaleString()}
                          </small>
                          {notification.isRead && notification.readAt && (
                            <small className="text-success">
                              Read on{' '}
                              {new Date(notification.readAt).toLocaleString()}
                            </small>
                          )}
                        </div>
                      </div>

                      <div className="notification-actions">
                        {notification.type === 'payment_pending' && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handlePayNow(notification)}
                            title="Pay Now"
                          >
                            <FiCreditCard size={14} />
                            Pay Now
                          </button>
                        )}
                        {!notification.isRead && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleMarkAsRead(notification._id)}
                            title="Mark as read"
                          >
                            <FiCheck size={14} />
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(notification._id)}
                          title="Delete"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
                      disabled={!pagination.hasPrev}
                    >
                      Previous
                    </button>

                    <span className="pagination-info">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>

                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
                      disabled={!pagination.hasNext}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmState.open}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
      />
    </div>
  );
};

export default Notifications;
