import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:5000/api/inventory/analytics');
        setData(res.data);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="dashboard-header">
          <h1>Analytics</h1>
          <p>No analytics available yet.</p>
        </div>
      </div>
    );
  }

  const { overview = {}, categoryStats = [] } = data || {};
  const safeStats = Array.isArray(categoryStats) ? categoryStats : [];

  return (
    <div className="dashboard" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div className="dashboard-header">
        <h1>Analytics</h1>
        <p>Inventory overview and category breakdown</p>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-content">
            <h3>{overview.totalProducts}</h3>
            <p>Total Products</p>
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-content">
            <h3>{overview.lowStockProducts}</h3>
            <p>Low Stock</p>
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-content">
            <h3>{overview.outOfStockProducts}</h3>
            <p>Out of Stock</p>
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-content">
            <h3>${Number(overview.totalInventoryValue || 0).toFixed(2)}</h3>
            <p>Total Inventory Value</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section" style={{ marginTop: 20 }}>
        <div className="section-header">
          <h2>By Category</h2>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Products</th>
                    <th>Total Stock</th>
                    <th>Total Value</th>
                    <th>Low Stock Items</th>
                  </tr>
                </thead>
                <tbody>
                  {safeStats.map(row => (
                    <tr key={row._id}>
                      <td>{row._id}</td>
                      <td>{row.count}</td>
                      <td>{row.totalStock}</td>
                      <td>${Number(row.totalValue || 0).toFixed(2)}</td>
                      <td>{row.lowStockCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;


