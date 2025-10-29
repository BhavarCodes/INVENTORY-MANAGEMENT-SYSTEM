import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';

const OrderModal = ({ order, onClose, onSave }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    products: [],
    supplier: {
      name: '',
      email: '',
      phone: ''
    },
    expectedDeliveryDate: '',
    notes: ''
  });
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm] = useState('');

  // Get today's date in YYYY-MM-DD format for min date
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get maximum delivery date (4 days from today) in YYYY-MM-DD format
  const getMaxDeliveryDate = () => {
    const today = new Date();
    const maxDate = new Date(today.getTime() + (4 * 24 * 60 * 60 * 1000)); // Add 4 days
    return maxDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchProducts();
    if (order) {
      setFormData({
        products: order.products.map(item => ({
          product: item.product._id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        })),
        supplier: order.supplier || { name: '', email: '', phone: '' },
        expectedDeliveryDate: order.expectedDeliveryDate 
          ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0] 
          : getTodayDate(),
        notes: order.notes || ''
      });
    } else {
      // Set today's date as default for new orders
      setFormData(prev => ({
        ...prev,
        expectedDeliveryDate: getTodayDate()
      }));
    }
  }, [order]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        // Ctrl+Enter or Cmd+Enter to submit (to avoid conflicts with form inputs)
        e.preventDefault();
        const form = document.querySelector('.order-modal-form');
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

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/inventory?limit=1000');
      setAvailableProducts(response.data.products);
    } catch (error) {
      console.error('Fetch products error:', error);
      toast.error('Failed to fetch products');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('supplier.')) {
      setFormData(prev => ({
        ...prev,
        supplier: {
          ...prev.supplier,
          [name.split('.')[1]]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Separate validation function for date field on blur
  const validateDeliveryDate = (value) => {
    if (!value) return true;
    
    // Check if the date string is complete (YYYY-MM-DD format)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      toast.error('Please enter date in YYYY-MM-DD format');
      return false;
    }
    
    const selectedDate = new Date(value + 'T00:00:00');
    
    // Check if the date is valid
    if (isNaN(selectedDate.getTime())) {
      toast.error('Please enter a valid date');
      return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 4);
    
    if (selectedDate < today) {
      toast.error('Expected delivery date cannot be in the past');
      return false;
    }
    
    if (selectedDate > maxDate) {
      toast.error('Expected delivery date cannot be more than 4 days from today');
      return false;
    }
    
    return true;
  };

  const handleDateBlur = (e) => {
    const value = e.target.value;
    if (!validateDeliveryDate(value)) {
      // Reset to today's date if invalid
      setFormData(prev => ({
        ...prev,
        expectedDeliveryDate: getTodayDate()
      }));
    }
  };

  const handleAddProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, {
        product: '',
        productName: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0
      }]
    }));
  };

  const handleProductChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          
          if (field === 'product') {
            const selectedProduct = availableProducts.find(p => p._id === value);
            if (selectedProduct) {
              updatedItem.productName = selectedProduct.name;
              updatedItem.unitPrice = selectedProduct.costPrice;
              updatedItem.totalPrice = selectedProduct.costPrice * updatedItem.quantity;
            }
          } else if (field === 'quantity') {
            updatedItem.quantity = parseInt(value) || 0;
            updatedItem.totalPrice = updatedItem.unitPrice * updatedItem.quantity;
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const handleRemoveProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate expected delivery date before submission
    if (formData.expectedDeliveryDate && !validateDeliveryDate(formData.expectedDeliveryDate)) {
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        products: formData.products.map(item => ({
          product: item.product,
          quantity: item.quantity
        })),
        expectedDeliveryDate: formData.expectedDeliveryDate ? new Date(formData.expectedDeliveryDate) : null
      };

      if (order) {
        await axios.put(`http://localhost:5000/api/orders/${order._id}`, submitData);
        toast.success('Order updated successfully');
        onSave();
      } else {
        const response = await axios.post('http://localhost:5000/api/orders', submitData);
        toast.success('Order created successfully');
        
        // Check if payment is required
        if (response.data.requiresPayment) {
          onClose(); // Close modal first
          navigate(`/payment/${response.data.order._id}`);
        } else {
          onSave();
        }
      }
    } catch (error) {
      console.error('Save order error:', error);
      
      // Handle specific order size limit error
      if (error.response?.data?.error === 'ORDER_SIZE_LIMIT_EXCEEDED') {
        const errorData = error.response.data;
        toast.error(
          `Order quantity (${errorData.requestedQuantity}) exceeds the maximum order limit for "${errorData.productName}". Maximum allowed: ${errorData.maxOrderQuantity}`,
          { autoClose: 8000 }
        );
      } else {
        toast.error(error.response?.data?.message || 'Failed to save order');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = formData.products.reduce((sum, item) => sum + item.totalPrice, 0);

  console.log('OrderModal rendering with order:', order);
  
  return (
    <div className="modal-overlay">
      <div className="modal large-modal">
        <div className="modal-header">
          <h2>{order ? 'Edit Order' : 'Create New Order'}</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body order-modal-form">
          {/* Products Section */}
          <div className="products-section">
            <div className="section-header">
              <h3>Products</h3>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleAddProduct}
              >
                <FiPlus size={16} />
                Add Product
              </button>
            </div>

            {formData.products.length === 0 ? (
              <p className="text-muted">No products added yet</p>
            ) : (
              <div className="products-list">
                {formData.products.map((item, index) => (
                  <div key={index} className="product-item">
                    <div className="product-select">
                      <label className="form-label">Product</label>
                      <select
                        value={item.product}
                        onChange={(e) => handleProductChange(index, 'product', e.target.value)}
                        className="form-control"
                        required
                        disabled={loading}
                      >
                        <option value="">Select a product</option>
                        {filteredProducts.map(product => (
                          <option key={product._id} value={product._id}>
                            {product.name} ({product.sku}) - ₹{product.costPrice} (Max: {product.maxStockLevel})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="product-quantity">
                      <label className="form-label">
                        Quantity
                        {(() => {
                          const selectedProduct = availableProducts.find(p => p._id === item.product);
                          return selectedProduct ? ` (Max: ${selectedProduct.maxStockLevel})` : '';
                        })()}
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                        className="form-control"
                        min="1"
                        max={(() => {
                          const selectedProduct = availableProducts.find(p => p._id === item.product);
                          return selectedProduct ? selectedProduct.maxStockLevel : undefined;
                        })()}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="product-price">
                      <label className="form-label">Unit Price</label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        className="form-control"
                        disabled
                        step="0.01"
                      />
                    </div>

                    <div className="product-total">
                      <label className="form-label">Total</label>
                      <input
                        type="number"
                        value={item.totalPrice.toFixed(2)}
                        className="form-control"
                        disabled
                        step="0.01"
                      />
                    </div>

                    <div className="product-actions">
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemoveProduct(index)}
                        disabled={loading}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="total-section">
              <h4>Total Amount: ₹{totalAmount.toFixed(2)}</h4>
            </div>
          </div>

          {/* Supplier Information */}
          <div className="supplier-section">
            <h3>Supplier Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Supplier Name</label>
                <input
                  type="text"
                  name="supplier.name"
                  value={formData.supplier.name}
                  onChange={handleChange}
                  className="form-control"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Supplier Email</label>
                <input
                  type="email"
                  name="supplier.email"
                  value={formData.supplier.email}
                  onChange={handleChange}
                  className="form-control"
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
          </div>

          {/* Order Details */}
          <div className="order-details-section">
            <h3>Order Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Expected Delivery Date (within 4 days)</label>
                <input
                  type="date"
                  name="expectedDeliveryDate"
                  value={formData.expectedDeliveryDate}
                  onChange={handleChange}
                  onBlur={handleDateBlur}
                  className="form-control"
                  min={getTodayDate()}
                  max={getMaxDeliveryDate()}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="form-control"
                rows="3"
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
            disabled={loading || formData.products.length === 0}
          >
            {loading ? 'Saving...' : (order ? 'Update Order' : 'Create Order')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
