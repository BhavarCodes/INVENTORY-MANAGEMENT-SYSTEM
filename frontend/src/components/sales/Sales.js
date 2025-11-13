import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_ENDPOINTS } from '../../config/api';
import './Sales.css';
import { useNavigate } from 'react-router-dom';

const fmtCurrency = (n) => `₹${(n || 0).toFixed(2)}`;

function useDateRange(initialDays = 7) {
  const [from, setFrom] = useState(() => new Date(Date.now() - initialDays*24*60*60*1000).toISOString().slice(0,10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0,10));
  return { from, to, setFrom, setTo };
}

const Sales = () => {
  const navigate = useNavigate();
  const { from, to, setFrom, setTo } = useDateRange(7);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [status, setStatus] = useState('completed');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const summaryParams = { from, to };
      const listParams = { from, to, page, limit };
      if (paymentMethod) listParams.paymentMethod = paymentMethod;
      if (status) listParams.status = status;
      const p1 = axios.get(API_ENDPOINTS.SALES_SUMMARY, { params: summaryParams });
      const p2 = axios.get(API_ENDPOINTS.SALES_LIST, { params: listParams });
      const [s, l] = await Promise.all([p1, p2]);
      setSummary(s.data);
      setRows(l.data.rows);
      setTotal(l.data.total);
    } catch (err) {
      console.error('Sales fetch error:', err);
  const status = err.response?.status;
  const message = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || err.message || 'Failed to load sales';
      if (status === 401) {
        toast.error('Session expired. Please log in again.');
        navigate('/login');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(); // eslint-disable-next-line
  }, [from, to, page, limit, paymentMethod, status]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

  return (
    <div className="sales-container">
      <div className="page-header">
        <h2>Sales</h2>
      </div>

      <div className="filters card">
        <div className="card-body filters-grid">
          <div>
            <label className="form-label">From</label>
            <input type="date" value={from} onChange={(e)=>{ setPage(1); setFrom(e.target.value); }} className="form-control" />
          </div>
          <div>
            <label className="form-label">To</label>
            <input type="date" value={to} onChange={(e)=>{ setPage(1); setTo(e.target.value); }} className="form-control" />
          </div>
          <div>
            <label className="form-label">Payment Method</label>
            <select value={paymentMethod} onChange={(e)=>{ setPage(1); setPaymentMethod(e.target.value); }} className="form-control">
              <option value="">All</option>
              <option value="upi">UPI</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="net_banking">Net Banking</option>
              <option value="wallet">Wallet</option>
              <option value="cod">COD</option>
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select value={status} onChange={(e)=>{ setPage(1); setStatus(e.target.value); }} className="form-control">
              <option value="">All</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="form-label">Page Size</label>
            <select value={limit} onChange={(e)=>{ setPage(1); setLimit(parseInt(e.target.value,10)); }} className="form-control">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div style={{alignSelf:'end'}}>
            <button className="btn btn-secondary" onClick={()=>{ setPage(1); fetchAll(); }} disabled={loading}>Refresh</button>
          </div>
        </div>
      </div>

      {summary && (
        <div className="metrics-grid">
          <div className="metric card"><div className="card-body"><div className="metric-label">Total Revenue</div><div className="metric-value">{fmtCurrency(summary.totalRevenue)}</div></div></div>
          <div className="metric card"><div className="card-body"><div className="metric-label">Total Sales</div><div className="metric-value">{summary.totalSales}</div></div></div>
          <div className="metric card"><div className="card-body"><div className="metric-label">Avg Order Value</div><div className="metric-value">{fmtCurrency(summary.averageOrderValue)}</div></div></div>
        </div>
      )}

      {summary?.paymentBreakdown?.length > 0 && (
        <div className="card">
          <div className="card-body">
            <h3 style={{marginTop:0}}>Payment Breakdown</h3>
            <div className="breakdown-grid">
              {summary.paymentBreakdown.map((b)=> (
                <div key={b.method} className="breakdown-item">
                  <div className="breakdown-label">{b.method.replace('_',' ').toUpperCase()}</div>
                  <div className="breakdown-value">{fmtCurrency(b.amount)} <span className="muted">({b.count})</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {summary?.topProducts?.length > 0 && (
        <div className="card">
          <div className="card-body">
            <h3 style={{marginTop:0}}>Top Products</h3>
            <div className="top-products">
              {summary.topProducts.map((p)=> (
                <div key={p.productId} className="top-item">
                  <div className="top-name">{p.name}</div>
                  <div className="top-meta">{p.units} units • {fmtCurrency(p.revenue)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <h3 style={{marginTop:0}}>Sales</h3>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Order</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="muted">No sales found for the selected period.</td></tr>
                )}
                {rows.map((r)=> (
                  <tr key={r._id}>
                    <td>{r.paymentDate ? new Date(r.paymentDate).toLocaleString() : new Date(r.createdAt).toLocaleString()}</td>
                    <td>{r.orderNumber || r.orderId}</td>
                    <td>{r.paymentMethod?.replace('_',' ')?.toUpperCase()}</td>
                    <td>{r.status?.toUpperCase()}</td>
                    <td className="text-right">{fmtCurrency(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pager">
            <button className="btn btn-secondary" disabled={page<=1 || loading} onClick={()=> setPage(p=> Math.max(1, p-1))}>Prev</button>
            <span className="muted">Page {page} of {totalPages}</span>
            <button className="btn btn-secondary" disabled={page>=totalPages || loading} onClick={()=> setPage(p=> Math.min(totalPages, p+1))}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;
