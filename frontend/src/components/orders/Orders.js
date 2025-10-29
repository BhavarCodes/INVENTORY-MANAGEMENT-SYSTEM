import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEye, FiEdit, FiTrash2, FiPackage } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import OrderModal from './OrderModal';
import ConfirmationModal from '../common/ConfirmationModal';
import PageHeader from '../common/PageHeader';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    orderType: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 10,
        ...filters
      });

      const response = await axios.get(`http://localhost:5000/api/orders?${params}`);
      setOrders(response.data.orders);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Fetch orders error:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleAddOrder = () => {
    console.log('New Order button clicked');
    setEditingOrder(null);
    setShowModal(true);
    console.log('Order modal state set to true');
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setShowModal(true);
  };

  const handleDeleteOrder = (orderId) => {
    setOrderToDelete(orderId);
    setShowConfirmModal(true);
  };

  const confirmDeleteOrder = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/orders/${orderToDelete}`);
      toast.success('Order cancelled successfully');
      fetchOrders();
      setShowConfirmModal(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error('Cancel order error:', error);
      toast.error('Failed to cancel order');
    }
  };

  // Status is read-only in UI; handler removed.

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'processing':
        return 'primary';
      case 'shipped':
        return 'success';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'danger';
      case 'refunded': return 'secondary';
      default: return 'warning';
    }
  };

  // getStatusText not needed; status is displayed uppercased directly.

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  return (
    <div className="orders">
      <PageHeader title="Order Management" subtitle="Manage your inventory orders">
        <button
          className="btn btn-secondary"
          style={{ marginRight: 10 }}
          onClick={() => {
              const headers = ['Order Number','Type','Status','Products','Total Amount','Created Date','Expected Delivery'];
              const rows = orders.map(o => [
                o.orderNumber,
                o.orderType,
                o.status,
                o.products?.length || 0,
                o.totalAmount?.toFixed(2) || '0.00',
                new Date(o.createdAt).toLocaleString(),
                o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toLocaleDateString() : ''
              ]);
              const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'orders.csv';
              a.click();
              URL.revokeObjectURL(url);
          }}
        >
          Export CSV
        </button>
        <button className="btn btn-primary" onClick={handleAddOrder}>
          <FiPlus size={16} />
          New Order
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="filters-section">
        <div className="card">
          <div className="card-body">
            <div className="filters-grid">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="form-control"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Order Type</label>
                <select
                  name="orderType"
                  value={filters.orderType}
                  onChange={handleFilterChange}
                  className="form-control"
                >
                  <option value="">All Types</option>
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-section">
        <div className="card">
          <div className="card-header">
            <h3>Orders ({pagination.totalOrders})</h3>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center">
                <div className="loading-spinner"></div>
                <p>Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <FiPackage size={48} className="empty-icon" />
                <h3>No orders found</h3>
                <p>Start by creating your first order</p>
                <button className="btn btn-primary" onClick={handleAddOrder}>
                  <FiPlus size={16} />
                  New Order
                </button>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Order Number</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Products</th>
                        <th>Total Amount</th>
                        <th>Created Date</th>
                        <th>Expected Delivery</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order._id}>
                          <td>
                            <strong>{order.orderNumber}</strong>
                          </td>
                          <td>
                            <span className={`badge badge-${order.orderType === 'automatic' ? 'info' : 'secondary'}`}>
                              {order.orderType.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge badge-${getStatusColor(order.status)}`}
                              title="Status is read-only"
                              style={{ display: 'inline-block', padding: '6px 10px' }}
                            >
                              {order.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            {order.status === 'cancelled' ? (
                              <span className="badge badge-info" title="Refund is being processed">
                                REFUND IN PROGRESS
                              </span>
                            ) : (
                              <>
                                <span className={`badge badge-${getPaymentStatusColor(order.paymentStatus || 'pending')}`}>
                                  {(order.paymentStatus || 'pending').toUpperCase()}
                                </span>
                                {order.paymentStatus === 'pending' && (
                                  <button
                                    className="btn btn-xs btn-success ml-2"
                                    onClick={() => navigate(`/payment/${order._id}`)}
                                    title="Pay Now"
                                  >
                                    Pay
                                  </button>
                                )}
                              </>
                            )}
                          </td>
                          <td>
                            {order.products.length} item{order.products.length !== 1 ? 's' : ''}
                          </td>
                          <td>₹{order.totalAmount.toFixed(2)}</td>
                          <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td>
                            {order.expectedDeliveryDate 
                              ? new Date(order.expectedDeliveryDate).toLocaleDateString()
                              : 'Not set'
                            }
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn btn-sm btn-info"
                                onClick={() => handleEditOrder(order)}
                                title="View Details"
                              >
                                <FiEye size={14} />
                              </button>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleEditOrder(order)}
                                title="Edit"
                              >
                                <FiEdit size={14} />
                              </button>
                              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDeleteOrder(order._id)}
                                  title="Cancel"
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrev}
                    >
                      Previous
                    </button>
                    
                    <span className="pagination-info">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
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

      {/* Order Modal */}
      {showModal && (
        <OrderModal
          order={editingOrder}
          onClose={() => {
            console.log('Closing order modal');
            setShowModal(false);
          }}
          onSave={() => {
            console.log('Saving order');
            setShowModal(false);
            fetchOrders();
          }}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setOrderToDelete(null);
        }}
        onConfirm={confirmDeleteOrder}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Cancel Order"
        cancelText="Keep Order"
        type="warning"
      />
    </div>
  );
};

export default Orders;
