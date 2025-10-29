import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    notificationEmail: '',
    lowStockThreshold: 0
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        notificationEmail: user.settings?.notificationEmail || user.email || '',
        lowStockThreshold: user.settings?.lowStockThreshold ?? 0
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'lowStockThreshold' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile({
      settings: {
        notificationEmail: formData.notificationEmail,
        lowStockThreshold: Number(formData.lowStockThreshold) || 0
      }
    });
    setSaving(false);
    if (res.success) {
      toast.success('Settings saved');
    } else {
      toast.error(res.message || 'Failed to save settings');
    }
  };

  return (
    <div className="dashboard" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="dashboard-header">
        <h1>Settings</h1>
        <p>Configure notifications and thresholds</p>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Notification Email</label>
              <input
                type="email"
                name="notificationEmail"
                className="form-control"
                value={formData.notificationEmail}
                onChange={handleChange}
                required
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Low Stock Threshold (default)</label>
              <input
                type="number"
                name="lowStockThreshold"
                className="form-control"
                min="0"
                value={formData.lowStockThreshold}
                onChange={handleChange}
                disabled={saving}
              />
              <small className="text-muted">Used when product-specific minStockLevel isn’t set.</small>
            </div>

            <div className="card-footer" style={{ background: 'transparent', borderTop: 'none', padding: 0 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginLeft: 10 }}
                onClick={async () => {
                  try {
                    await axios.post('http://localhost:5000/api/maintenance/low-stock-check');
                    toast.success('Low stock check executed');
                  } catch (e) {
                    toast.error('Failed to run low stock check');
                  }
                }}
              >
                Run Low Stock Check Now
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginLeft: 10 }}
                onClick={async () => {
                  try {
                    await axios.post('http://localhost:5000/api/maintenance/auto-renew');
                    toast.success('Auto stock renewal executed');
                  } catch (e) {
                    toast.error('Failed to run auto stock renewal');
                  }
                }}
              >
                Run Auto-Renew Now
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;


