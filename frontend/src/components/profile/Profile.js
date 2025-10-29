import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
          country: user.address?.country || ''
        }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [key]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { email, ...payload } = formData; // email is not editable via this endpoint
    const res = await updateProfile(payload);
    setSaving(false);
    if (res.success) {
      toast.success('Profile updated');
    } else {
      toast.error(res.message || 'Update failed');
    }
  };

  return (
    <div className="profile" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="inventory-header" style={{ marginBottom: 20 }}>
        <div className="header-left">
          <h1>My Profile</h1>
          <p>Update your personal information</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={saving}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  disabled
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>
            </div>

            <h4 className="mt-3 mb-2">Address</h4>
            <div className="form-group">
              <label className="form-label">Street</label>
              <input
                type="text"
                name="address.street"
                className="form-control"
                value={formData.address.street}
                onChange={handleChange}
                disabled={saving}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="address.city"
                  className="form-control"
                  value={formData.address.city}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  name="address.state"
                  className="form-control"
                  value={formData.address.state}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">ZIP Code</label>
                <input
                  type="text"
                  name="address.zipCode"
                  className="form-control"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <input
                  type="text"
                  name="address.country"
                  className="form-control"
                  value={formData.address.country}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="card-footer" style={{ background: 'transparent', borderTop: 'none', padding: 0, marginTop: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;


