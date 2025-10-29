import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPackage, FiAlertTriangle, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import ConfirmationModal from '../common/ConfirmationModal';
import './Dashboard.css';
import PageHeader from '../common/PageHeader';

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch analytics
      const analyticsResponse = await axios.get('http://localhost:5000/api/inventory/analytics');
      setAnalytics(analyticsResponse.data);

      // Fetch low stock products
      const lowStockResponse = await axios.get('http://localhost:5000/api/inventory/low-stock');
      setLowStockProducts(lowStockResponse.data);

      // Fetch recent orders
      const ordersResponse = await axios.get('http://localhost:5000/api/orders?limit=5');
      setRecentOrders(ordersResponse.data.orders);

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleReorder = async (productId, productName) => {
    try {
  await axios.post(`http://localhost:5000/api/inventory/${productId}/reorder`);
      
      toast.success(`${productName} has been reordered and restocked!`);
      
      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Reorder error:', error);
      toast.error(`Failed to reorder ${productName}`);
    }
  };

  const handleBulkReorder = async () => {
    if (lowStockProducts.length === 0) {
      toast.info('No low stock products to reorder');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmBulkReorder = async () => {
    try {
      const productIds = lowStockProducts.map(product => product._id);
      const response = await axios.post('http://localhost:5000/api/inventory/reorder-multiple', {
        productIds
      });
      
      if (response.data.errors && response.data.errors.length > 0) {
        // Show warnings for products that couldn't be reordered
        const errorMessages = response.data.errors.map(err => err.error).join(', ');
        toast.warning(`Bulk reorder completed with some issues: ${response.data.results.length} products reordered. Issues: ${errorMessages}`);
      } else {
        toast.success(`Bulk reorder completed: ${response.data.results.length} products reordered!`);
      }
      
      // Refresh dashboard data
      fetchDashboardData();
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Bulk reorder error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to complete bulk reorder');
      }
    }
  };

  const handleTriggerAutoReorder = async () => {
    try {
      await axios.post('http://localhost:5000/api/inventory/trigger-auto-reorder');
      toast.success('Automatic reorder check triggered!');
      
      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Trigger auto-reorder error:', error);
      toast.error('Failed to trigger automatic reorder');
    }
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'out_of_stock':
        return 'danger';
      case 'low_stock':
        return 'warning';
      case 'in_stock':
        return 'success';
      case 'overstock':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const getStockStatusIcon = (status) => {
    switch (status) {
      case 'out_of_stock':
        return <FiAlertTriangle className="text-danger" />;
      case 'low_stock':
        return <FiAlertTriangle className="text-warning" />;
      case 'in_stock':
        return <FiCheckCircle className="text-success" />;
      case 'overstock':
        return <FiTrendingUp className="text-info" />;
      default:
        return <FiPackage className="text-secondary" />;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome to your grocery inventory management system"
        right={(
          <button
            className="btn btn-primary"
            onClick={handleTriggerAutoReorder}
            title="Trigger automatic reorder check"
          >
            <FiTrendingUp className="mr-2" />
            Auto Reorder
          </button>
        )}
      />

      {/* Analytics Cards */}
      {analytics && (
        <div className="analytics-grid">
          <div
            className="analytics-card clickable"
            onClick={() => navigate('/inventory')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/inventory'); }}
            title="View all products"
          >
            <div className="analytics-icon">
              <FiPackage size={24} />
            </div>
            <div className="analytics-content">
              <h3>{analytics.overview.totalProducts}</h3>
              <p>Total Products</p>
            </div>
          </div>

          <div
            className="analytics-card clickable"
            onClick={() => navigate('/inventory?stockStatus=low_stock')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/inventory?stockStatus=low_stock'); }}
            title="View low stock products"
          >
            <div className="analytics-icon warning">
              <FiAlertTriangle size={24} />
            </div>
            <div className="analytics-content">
              <h3>{analytics.overview.lowStockProducts}</h3>
              <p>Low Stock Items</p>
            </div>
          </div>

          <div
            className="analytics-card clickable"
            onClick={() => navigate('/inventory?stockStatus=out_of_stock')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/inventory?stockStatus=out_of_stock'); }}
            title="View out of stock products"
          >
            <div className="analytics-icon danger">
              <FiAlertTriangle size={24} />
            </div>
            <div className="analytics-content">
              <h3>{analytics.overview.outOfStockProducts}</h3>
              <p>Out of Stock</p>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon success">
              <FiTrendingUp size={24} />
            </div>
            <div className="analytics-content">
              <h3>₹{analytics.overview.totalInventoryValue?.toFixed(2) || '0.00'}</h3>
              <p>Total Inventory Value</p>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-content">
        {/* Low Stock Products */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Low Stock Products</h2>
            <div className="section-actions">
              <button 
                className="btn btn-sm btn-info"
                onClick={handleTriggerAutoReorder}
                style={{ marginRight: '10px' }}
                title="Trigger automatic reorder check for low stock products"
              >
                🔄 Auto Check
              </button>
              {lowStockProducts.length > 0 && (
                <button 
                  className="btn btn-sm btn-warning"
                  onClick={handleBulkReorder}
                  style={{ marginRight: '10px' }}
                >
                  Reorder All ({lowStockProducts.length})
                </button>
              )}
              <a href="/inventory" className="btn btn-sm btn-primary">
                View All
              </a>
            </div>
          </div>
          
          <div className="card">
            <div className="card-body">
              {lowStockProducts.length === 0 ? (
                <p className="text-center text-muted">No low stock products</p>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Current Stock</th>
                        <th>Min Required</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockProducts.slice(0, 5).map(product => (
                        <tr key={product._id}>
                          <td>
                            <div>
                              <strong>{product.name}</strong>
                              <br />
                              <small className="text-muted">{product.category}</small>
                            </div>
                          </td>
                          <td>{product.sku}</td>
                          <td>{product.currentStock} {product.unit}</td>
                          <td>{product.minStockLevel} {product.unit}</td>
                          <td>
                            <span className={`badge badge-${getStockStatusColor(product.stockStatus)}`}>
                              {getStockStatusIcon(product.stockStatus)}
                              {product.stockStatus.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => handleReorder(product._id, product.name)}
                            >
                              Reorder
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Orders</h2>
            <a href="/orders" className="btn btn-sm btn-primary">
              View All
            </a>
          </div>
          
          <div className="card">
            <div className="card-body">
              {recentOrders.length === 0 ? (
                <p className="text-center text-muted">No recent orders</p>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Order Number</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Total Amount</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map(order => (
                        <tr key={order._id}>
                          <td>{order.orderNumber}</td>
                          <td>
                            <span className={`badge badge-${order.orderType === 'automatic' ? 'info' : 'secondary'}`}>
                              {order.orderType.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${getOrderStatusColor(order.status)}`}>
                              {order.status.toUpperCase()}
                            </span>
                          </td>
                          <td>₹{order.totalAmount.toFixed(2)}</td>
                          <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmBulkReorder}
        title="Bulk Reorder"
        message={`Are you sure you want to reorder all ${lowStockProducts.length} low stock products?`}
        confirmText="Reorder All"
        cancelText="Cancel"
        type="info"
      />
    </div>
  );
};

const getOrderStatusColor = (status) => {
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

export default Dashboard;
