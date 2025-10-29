import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiPackage, FiRefreshCw } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductModal from './ProductModal';
import ConfirmationModal from '../common/ConfirmationModal';
import RestockModal from '../common/RestockModal';
import './Inventory.css';
import PageHeader from '../common/PageHeader';

const Inventory = () => {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [productToRestock, setProductToRestock] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    stockStatus: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0
  });

  useEffect(() => {
    // Initialize filters from query string when arriving from dashboard cards
    const params = new URLSearchParams(location.search);
    const stockStatus = params.get('stockStatus') || '';
    setFilters(prev => ({ ...prev, stockStatus }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [location.search]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 10,
        ...filters
      });

      const response = await axios.get(`http://localhost:5000/api/inventory?${params}`);
      
      setProducts(response.data.products);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Fetch products error:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddProduct = () => {
    console.log('Add Product button clicked');
    setEditingProduct(null);
    setShowModal(true);
    console.log('Modal state set to true');
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDeleteProduct = (productId) => {
    setProductToDelete(productId);
    setShowConfirmModal(true);
  };

  const confirmDeleteProduct = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/inventory/${productToDelete}`);
      toast.success('Product deleted successfully');
      fetchProducts();
      setShowConfirmModal(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Delete product error:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleRestock = async (productId, quantity) => {
    try {
      await axios.post(`http://localhost:5000/api/inventory/${productId}/restock`, { quantity });
      toast.success('Product restocked successfully');
      fetchProducts();
      setShowRestockModal(false);
      setProductToRestock(null);
    } catch (error) {
      console.error('Restock error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to restock product');
      }
    }
  };

  const handleRestockClick = (product) => {
    setProductToRestock(product);
    setShowRestockModal(true);
  };

  const confirmRestock = (quantity) => {
    if (productToRestock) {
      handleRestock(productToRestock._id, quantity);
    }
  };

  const handleReorder = async (productId, productName) => {
    try {
      await axios.post(`http://localhost:5000/api/inventory/${productId}/reorder`);
      toast.success(`${productName} has been reordered and restocked!`);
      fetchProducts();
    } catch (error) {
      console.error('Reorder error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(`Failed to reorder ${productName}`);
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
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

  const getStockStatusText = (status) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  return (
    <div className="inventory">
      <PageHeader
        title="Inventory Management"
        subtitle="Manage your grocery store inventory"
      >
        <button
          className="btn btn-secondary"
          style={{ marginRight: 10 }}
          onClick={() => {
            const headers = ['Name','SKU','Category','Current Stock','Min Level','Max Level','Unit','Cost Price','Selling Price'];
            const rows = products.map(p => [
              p.name,
              p.sku,
              p.category,
              p.currentStock,
              p.minStockLevel,
              p.maxStockLevel,
              p.unit,
              p.costPrice,
              p.sellingPrice
            ]);
            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'inventory.csv';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export CSV
        </button>
        <button className="btn btn-primary" onClick={handleAddProduct}>
          <FiPlus size={16} />
          Add Product
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="filters-section">
        <div className="card">
          <div className="card-body">
            <div className="filters-grid">
              <div className="form-group">
                <label className="form-label">Search</label>
                <div className="search-input">
                  <FiSearch className="search-icon" />
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    className="form-control"
                    placeholder="Search products..."
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="form-control"
                >
                  <option value="">All Categories</option>
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
                <label className="form-label">Stock Status</label>
                <select
                  name="stockStatus"
                  value={filters.stockStatus}
                  onChange={handleFilterChange}
                  className="form-control"
                >
                  <option value="">All Status</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="overstock">Overstock</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="products-section">
        <div className="card">
          <div className="card-header">
            <h3>Products ({pagination.totalProducts})</h3>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center">
                <div className="loading-spinner"></div>
                <p>Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <FiPackage size={48} className="empty-icon" />
                <h3>No products found</h3>
                <p>Start by adding your first product to the inventory</p>
                <button className="btn btn-primary" onClick={handleAddProduct}>
                  <FiPlus size={16} />
                  Add Product
                </button>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Category</th>
                        <th>Current Stock</th>
                        <th>Min Level</th>
                        <th>Max Level</th>
                        <th>Max Order Qty</th>
                        <th>Status</th>
                        <th>Cost Price</th>
                        <th>Selling Price</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product._id}>
                          <td>
                            <div>
                              <strong>{product.name}</strong>
                              {product.description && (
                                <>
                                  <br />
                                  <small className="text-muted"> {product.description} </small>
                                </>
                              )}
                            </div>
                          </td>
                          <td>{product.sku}</td>
                          <td>
                            <span className="badge badge-secondary">
                              {product.category.toUpperCase()}
                            </span>
                          </td>
                          <td>{product.currentStock} {product.unit}</td>
                          <td>{product.minStockLevel} {product.unit}</td>
                          <td>{product.maxStockLevel} {product.unit}</td>
                          <td>{product.maxStockLevel}</td>
                          <td>
                            <span className={`badge badge-${getStockStatusColor(product.stockStatus)}`}>
                              {getStockStatusText(product.stockStatus)}
                            </span>
                            {product.currentStock >= product.maxStockLevel * 0.9 && product.currentStock < product.maxStockLevel && (
                              <span className="badge badge-warning ml-2" title="Near maximum stock level">
                                ⚠️ Near Max
                              </span>
                            )}
                          </td>
                          <td>₹{product.costPrice.toFixed(2)}</td>
                          <td>₹{product.sellingPrice.toFixed(2)}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleEditProduct(product)}
                                title="Edit"
                              >
                                <FiEdit size={14} />
                              </button>
                              {product.stockStatus === 'low_stock' && (
                                <button
                                  className="btn btn-sm btn-warning"
                                  onClick={() => handleReorder(product._id, product.name)}
                                  title="Auto Reorder"
                                >
                                  <FiRefreshCw size={14} />
                                </button>
                              )}
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleRestockClick(product)}
                                title="Manual Restock"
                              >
                                <FiPackage size={14} />
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeleteProduct(product._id)}
                                title="Delete"
                              >
                                <FiTrash2 size={14} />
                              </button>
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

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            console.log('Closing product modal');
            setShowModal(false);
          }}
          onSave={() => {
            console.log('Saving product');
            setShowModal(false);
            fetchProducts();
          }}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setProductToDelete(null);
        }}
        onConfirm={confirmDeleteProduct}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete Product"
        cancelText="Keep Product"
        type="danger"
      />

      {/* Restock Modal */}
      <RestockModal
        isOpen={showRestockModal}
        onClose={() => {
          setShowRestockModal(false);
          setProductToRestock(null);
        }}
        onConfirm={confirmRestock}
        productName={productToRestock?.name}
        title="Restock Product"
        confirmText="OK"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Inventory;