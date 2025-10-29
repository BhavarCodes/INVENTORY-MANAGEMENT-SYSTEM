import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';

const ProductModal = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'fruits',
    sku: '',
    barcode: '',
    currentStock: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    unit: 'kg',
    costPrice: 0,
    sellingPrice: 0,
    supplier: {
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
    },
    reorderQuantity: 1,
    maxOrderQuantity: 100,
    expiryDate: '',
    image: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || 'fruits',
        sku: product.sku || '',
        barcode: product.barcode || '',
        currentStock: product.currentStock || 0,
        minStockLevel: product.minStockLevel || 0,
        maxStockLevel: product.maxStockLevel || 0,
        unit: product.unit || 'kg',
        costPrice: product.costPrice || 0,
        sellingPrice: product.sellingPrice || 0,
        supplier: {
          name: product.supplier?.name || '',
          email: product.supplier?.email || '',
          phone: product.supplier?.phone || '',
          address: {
            street: product.supplier?.address?.street || '',
            city: product.supplier?.address?.city || '',
            state: product.supplier?.address?.state || '',
            zipCode: product.supplier?.address?.zipCode || '',
            country: product.supplier?.address?.country || ''
          }
        },
    reorderQuantity: product.reorderQuantity || 1,
    maxOrderQuantity: product.maxOrderQuantity || product.maxStockLevel || 100,
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
        image: product.image || ''
      });
    }
  }, [product]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        // Ctrl+Enter or Cmd+Enter to submit (to avoid conflicts with form inputs)
        e.preventDefault();
        const form = document.querySelector('.product-modal-form');
        if (form) {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('supplier.')) {
      const field = name.split('.');
      if (field.length === 2) {
        setFormData(prev => ({
          ...prev,
          supplier: {
            ...prev.supplier,
            [field[1]]: value
          }
        }));
      } else if (field.length === 3) {
        setFormData(prev => ({
          ...prev,
          supplier: {
            ...prev.supplier,
            address: {
              ...prev.supplier.address,
              [field[2]]: value
            }
          }
        }));
      }
    } else {
      setFormData(prev => {
        const next = { ...prev, [name]: value };
        // Keep maxOrderQuantity in sync with maxStockLevel
        if (name === 'maxStockLevel') {
          next.maxOrderQuantity = value;
        }
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        currentStock: parseInt(formData.currentStock),
        minStockLevel: parseInt(formData.minStockLevel),
        maxStockLevel: parseInt(formData.maxStockLevel),
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        reorderQuantity: parseInt(formData.reorderQuantity),
  // Ensure maxOrderQuantity mirrors maxStockLevel on submit
  maxOrderQuantity: parseInt(formData.maxStockLevel),
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null
      };

      if (product) {
        await axios.put(`http://localhost:5000/api/inventory/${product._id}`, submitData);
        toast.success('Product updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/inventory', submitData);
        toast.success('Product created successfully');
      }

      onSave();
    } catch (error) {
      console.error('Save product error:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  console.log('ProductModal rendering with product:', product);
  
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body product-modal-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-control"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">SKU *</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="form-control"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-control"
              rows="3"
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-control"
                required
                disabled={loading}
              >
                <option value="fruits">Fruits</option>
                <option value="vegetables">Vegetables</option>
                <option value="dairy">Dairy</option>
                <option value="meat">Meat</option>
                <option value="seafood">Seafood</option>
                <option value="bakery">Bakery</option>
                <option value="pantry">Pantry</option>
                <option value="beverages">Beverages</option>
                <option value="snacks">Snacks</option>
                <option value="canned">Canned</option>
                <option value="frozen">Frozen</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Unit *</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="form-control"
                required
                disabled={loading}
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="lb">Pound (lb)</option>
                <option value="oz">Ounce (oz)</option>
                <option value="liter">Liter</option>
                <option value="ml">Milliliter (ml)</option>
                <option value="piece">Piece</option>
                <option value="box">Box</option>
                <option value="pack">Pack</option>
                <option value="bag">Bag</option>
                <option value="bottle">Bottle</option>
                <option value="dozen">Dozen</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Current Stock *</label>
              <input
                type="number"
                name="currentStock"
                value={formData.currentStock}
                onChange={handleChange}
                className="form-control"
                min="0"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Minimum Stock Level *</label>
              <input
                type="number"
                name="minStockLevel"
                value={formData.minStockLevel}
                onChange={handleChange}
                className="form-control"
                min="0"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Maximum Stock Level *</label>
              <input
                type="number"
                name="maxStockLevel"
                value={formData.maxStockLevel}
                onChange={handleChange}
                className="form-control"
                min="0"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cost Price *</label>
              <input
                type="number"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleChange}
                className="form-control"
                min="0"
                step="0.01"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Selling Price *</label>
              <input
                type="number"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                className="form-control"
                min="0"
                step="0.01"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reorder Quantity *</label>
              <input
                type="number"
                name="reorderQuantity"
                value={formData.reorderQuantity}
                onChange={handleChange}
                className="form-control"
                min="1"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Order Quantity (auto = Max Level)</label>
              <input
                type="number"
                name="maxOrderQuantity"
                value={formData.maxStockLevel}
                className="form-control"
                min="1"
                disabled
                title="Max order quantity mirrors Max Level"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Barcode</label>
            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              className="form-control"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Expiry Date</label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className="form-control"
              disabled={loading}
            />
          </div>

          <h4>Supplier Information</h4>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Supplier Name *</label>
              <input
                type="text"
                name="supplier.name"
                value={formData.supplier.name}
                onChange={handleChange}
                className="form-control"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Supplier Email *</label>
              <input
                type="email"
                name="supplier.email"
                value={formData.supplier.email}
                onChange={handleChange}
                className="form-control"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Supplier Phone</label>
              <input
                type="tel"
                name="supplier.phone"
                value={formData.supplier.phone}
                onChange={handleChange}
                className="form-control"
                disabled={loading}
              />
            </div>
          </div>

          <h5>Supplier Address</h5>
          
          <div className="form-group">
            <label className="form-label">Street Address</label>
            <input
              type="text"
              name="supplier.address.street"
              value={formData.supplier.address.street}
              onChange={handleChange}
              className="form-control"
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                name="supplier.address.city"
                value={formData.supplier.address.city}
                onChange={handleChange}
                className="form-control"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                name="supplier.address.state"
                value={formData.supplier.address.state}
                onChange={handleChange}
                className="form-control"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">ZIP Code</label>
              <input
                type="text"
                name="supplier.address.zipCode"
                value={formData.supplier.address.zipCode}
                onChange={handleChange}
                className="form-control"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Country</label>
              <input
                type="text"
                name="supplier.address.country"
                value={formData.supplier.address.country}
                onChange={handleChange}
                className="form-control"
                disabled={loading}
              />
            </div>
          </div>
        </form>

        <div className="modal-footer">
          <div className="text-xs text-gray-400 mr-auto">
            Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">Esc</kbd> to cancel or <kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+Enter</kbd> to save
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
