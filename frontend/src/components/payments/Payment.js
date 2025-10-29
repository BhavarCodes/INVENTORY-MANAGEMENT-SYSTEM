import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCreditCard, FiSmartphone, FiDollarSign, FiCheck, FiClock } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Payment.css';
import { QRCodeSVG } from 'qrcode.react';

const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [qrImageFailed, setQrImageFailed] = useState(false);
  // UI state for expandable sections
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    nameOnCard: '',
    expiry: '',
    cvv: ''
  });
  const popularBanks = [
    'Birla College Bank',
    'Rajasthan Bank',
    'UP Bank',
    'Shoko Bank',
    'ICICI Bank',
    'Ghaplabaaz bank',

    
    
  ];
  const [selectedBank, setSelectedBank] = useState('');
  const [bankQuery, setBankQuery] = useState('');
  // UPI QR config
  const merchantUpiId = process.env.REACT_APP_MERCHANT_UPI_ID || 'grocery.shop@upi';
  // Prefer a provided image URL; fallback to a raw QR value if set
  const customQrImageUrl = process.env.REACT_APP_UPI_QR_IMAGE_URL || '/merchant-qr.png';
  const customQrValue = process.env.REACT_APP_UPI_QR_VALUE || '';


  const fetchOrder = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Fetch order error:', error);
      toast.error('Failed to fetch order details');
      navigate('/orders');
    } finally {
      setPageLoading(false);
    }
  }, [orderId, navigate]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Start or reset UPI QR when switching to UPI method
  // No temporary QR or countdown now; we only show your provided QR image (or fallback value).


  // Utilities: validation and helpers
  const luhnCheck = (numStr) => {
    let sum = 0;
    let shouldDouble = false;
    for (let i = numStr.length - 1; i >= 0; i--) {
      let digit = parseInt(numStr[i], 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  const isValidCardNumber = (raw) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    return luhnCheck(digits);
  };

  const isValidExpiry = (exp) => {
    if (!/^\d{2}\/\d{2}$/.test(exp)) return false;
    const [mmStr, yyStr] = exp.split('/');
    const mm = parseInt(mmStr, 10);
    const yy = parseInt(yyStr, 10);
    if (mm < 1 || mm > 12) return false;
    const now = new Date();
    const currentYY = now.getFullYear() % 100;
    const currentMM = now.getMonth() + 1;
    if (yy < currentYY) return false;
    if (yy === currentYY && mm < currentMM) return false;
    return true;
  };

  const isValidCVV = (cvv) => /^\d{3,4}$/.test(cvv);

  const isPaymentDetailsValid = () => {
    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      return (
        isValidCardNumber(cardDetails.cardNumber) &&
        cardDetails.nameOnCard.trim().length > 2 &&
        isValidExpiry(cardDetails.expiry) &&
        isValidCVV(cardDetails.cvv)
      );
    }
    if (paymentMethod === 'net_banking') {
      return selectedBank.trim().length > 0;
    }
    return true; // UPI, wallet, COD
  };

  const handlePayment = async () => {
    if (!isPaymentDetailsValid()) {
      if (paymentMethod === 'net_banking') {
        toast.error('Please choose your bank for Net Banking');
      } else if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
        toast.error('Please enter valid card details');
      }
      return;
    }
    setLoading(true);
    try {
      // Create payment
      const paymentResponse = await axios.post('http://localhost:5000/api/payments/create', {
        orderId: order._id,
        paymentMethod,
        meta: (paymentMethod === 'net_banking') ? { bank: selectedBank } :
              ((paymentMethod === 'credit_card' || paymentMethod === 'debit_card') ? {
                last4: cardDetails.cardNumber.replace(/\D/g, '').slice(-4),
                nameOnCard: cardDetails.nameOnCard.trim(),
                expiry: cardDetails.expiry
              } : {})
      });

      const { payment, gatewayOrder } = paymentResponse.data;

      // Simulate payment processing (replace with actual payment gateway integration)
      setTimeout(async () => {
        try {
          // Simulate successful payment
          await axios.post('http://localhost:5000/api/payments/verify', {
            paymentId: `pay_${Date.now()}`,
            orderId: gatewayOrder.id,
            signature: 'mock_signature',
            transactionId: payment.id
          });

          toast.success('Payment successful!');
          navigate('/orders', { 
            state: { 
              message: 'Payment completed successfully', 
              orderNumber: order.orderNumber 
            }
          });
        } catch (error) {
          console.error('Payment verification error:', error);
          toast.error('Payment verification failed');
        } finally {
          setLoading(false);
        }
      }, 2000); // Simulate 2 second processing time

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'upi':
        return <FiSmartphone />;
      case 'credit_card':
      case 'debit_card':
        return <FiCreditCard />;
      case 'net_banking':
        return <FiDollarSign />;
      default:
        return <FiCreditCard />;
    }
  };

  const getPaymentMethodName = (method) => {
    switch (method) {
      case 'upi':
        return 'UPI Payment';
      case 'credit_card':
        return 'Credit Card';
      case 'debit_card':
        return 'Debit Card';
      case 'net_banking':
        return 'Net Banking';
      case 'wallet':
        return 'Digital Wallet';
      case 'cod':
        return 'Cash on Delivery';
      default:
        return method;
    }
  };

  // Build a UPI deep link for mobile apps
  const generateUpiLink = () => {
    if (!order) return '';
    const params = new URLSearchParams({
      pa: merchantUpiId,
      pn: 'Grocery Store',
      am: String(order.totalAmount.toFixed(2)),
      cu: 'INR',
      tn: `Order ${order.orderNumber}`
    });
    return `upi://pay?${params.toString()}`;
  };

  if (pageLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading payment details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="error-container">
        <h2>Order not found</h2>
        <button onClick={() => navigate('/orders')} className="btn btn-primary">
          Back to Orders
        </button>
      </div>
    );
  }

  if (order.paymentStatus === 'completed') {
    return (
      <div className="payment-success-container">
        <div className="success-icon">
          <FiCheck size={64} color="green" />
        </div>
        <h2>Payment Already Completed</h2>
        <p>Payment for order {order.orderNumber} has already been completed.</p>
        <button onClick={() => navigate('/orders')} className="btn btn-primary">
          Back to Orders
        </button>
      </div>
    );
  }

  // If order is cancelled, do not allow payment
  if (order.status === 'cancelled') {
    return (
      <div className="error-container">
        <h2>Order Cancelled</h2>
        <p>Order {order.orderNumber} has been cancelled. Payment is not allowed.</p>
        <button onClick={() => navigate('/orders')} className="btn btn-primary">
          Back to Orders
        </button>
      </div>
    );
  }

  // Render helpers for expandable sections
  const renderCardDetails = () => (
    <div className="payment-option-expanded card-details card">
      <div className="card-body">
        <h4 style={{marginTop: 0}}>Enter Card Details</h4>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Card Number</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="1234 5678 9012 3456"
              value={cardDetails.cardNumber}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 19);
                const grouped = digits.replace(/(.{4})/g, '$1 ').trim();
                setCardDetails({ ...cardDetails, cardNumber: grouped });
              }}
              className="form-control"
              maxLength={19}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Name on Card</label>
            <input
              type="text"
              placeholder="Full Name"
              value={cardDetails.nameOnCard}
              onChange={(e) => setCardDetails({ ...cardDetails, nameOnCard: e.target.value })}
              className="form-control"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Expiry (MM/YY)</label>
            <input
              type="text"
              placeholder="MM/YY"
              value={cardDetails.expiry}
              onChange={(e) => {
                let v = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
                if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
                setCardDetails({ ...cardDetails, expiry: v });
              }}
              className="form-control"
              maxLength={5}
            />
          </div>
          <div className="form-group">
            <label className="form-label">CVV</label>
            <input
              type="password"
              inputMode="numeric"
              placeholder="***"
              value={cardDetails.cvv}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                setCardDetails({ ...cardDetails, cvv: v });
              }}
              className="form-control"
              maxLength={4}
            />
          </div>
        </div>
        <p className="text-muted">Your card details are encrypted and secure.</p>
      </div>
    </div>
  );

  const renderNetBanking = () => (
    <div className="payment-option-expanded netbanking-list card">
      <div className="card-body">
        <h4 style={{marginTop: 0}}>Choose Your Bank</h4>
        <div className="banks-grid">
          {popularBanks
            .filter(b => b.toLowerCase().includes(bankQuery.toLowerCase()))
            .map((bank) => (
              <button
                key={bank}
                type="button"
                className={`bank-tile btn btn-secondary ${selectedBank === bank ? 'selected' : ''}`}
                style={{ textAlign: 'left' }}
                onClick={() => setSelectedBank(bank)}
              >
                {bank}
              </button>
            ))}
        </div>
        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label">Or search your bank</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter bank name"
            value={bankQuery}
            onChange={(e) => setBankQuery(e.target.value)}
          />
        </div>
        {selectedBank && <p className="text-muted" style={{marginTop: 8}}>Selected bank: <strong>{selectedBank}</strong></p>}
      </div>
    </div>
  );

  return (
    <div className="payment-container">
      <div className="payment-card">
        <div className="payment-header">
          <h2>Complete Payment</h2>
          <p>Order #{order.orderNumber}</p>
        </div>

        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="summary-items">
            {order.products.map((item, index) => (
              <div key={index} className="summary-item">
                <span>{item.product.name} x {item.quantity}</span>
                <span>₹{item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="summary-total">
            <strong>Total: ₹{order.totalAmount.toFixed(2)}</strong>
          </div>
        </div>

        <div className="payment-methods">
          <h3>Select Payment Method</h3>
          <div className="payment-options">
            {['upi', 'credit_card', 'debit_card', 'net_banking', 'wallet'].map((method) => (
              <div key={method} className="payment-option-wrapper">
                <label className="payment-option">
                  <input
                    type="radio"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={loading}
                  />
                  <div className="payment-option-content">
                    {getPaymentMethodIcon(method)}
                    <span>{getPaymentMethodName(method)}</span>
                  </div>
                </label>

                {(paymentMethod === method && method === 'upi') && (
                  <div className="payment-option-expanded upi-qr card">
                    <div className="card-body">
                      <div className="upi-qr-grid">
                        <div className="qr-box">
                          <div className="qr-wrapper">
                            {customQrImageUrl && !qrImageFailed ? (
                              <img
                                src={customQrImageUrl}
                                alt="Merchant QR"
                                onError={() => setQrImageFailed(true)}
                                style={{ width: 180, height: 180, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                              />
                            ) : customQrValue ? (
                              <QRCodeSVG value={customQrValue} size={180} includeMargin />
                            ) : (
                              // Fallback: generate a dynamic QR using the UPI deeplink
                              <QRCodeSVG value={generateUpiLink()} size={180} includeMargin />
                            )}
                          </div>
                        </div>
                        <div className="upi-info">
                          <h4 style={{marginTop:0}}>Pay using UPI</h4>
                          <p>Scan the QR with your UPI app or pay to the UPI ID below:</p>
                          <div className="upi-id-box">
                            <code>{merchantUpiId}</code>
                            <button
                              type="button"
                              className="btn btn-xs btn-secondary"
                              onClick={() => navigator.clipboard.writeText(merchantUpiId).then(() => toast.success('UPI ID copied'))}
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-muted" style={{marginTop:8}}>
                            Amount: ₹{order.totalAmount.toFixed(2)} • Order: {order.orderNumber}
                          </p>
                          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                            <a
                              href={generateUpiLink()}
                              className="btn btn-sm btn-primary"
                              style={{ textDecoration: 'none' }}
                            >
                              Open in UPI app
                            </a>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => navigator.clipboard.writeText(generateUpiLink()).then(() => toast.success('UPI link copied'))}
                            >
                              Copy UPI link
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(paymentMethod === method && (method === 'credit_card' || method === 'debit_card')) && renderCardDetails()}
                {(paymentMethod === method && method === 'net_banking') && renderNetBanking()}
              </div>
            ))}
          </div>
        </div>

        <div className="payment-actions">
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/orders')}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handlePayment}
              disabled={loading || !isPaymentDetailsValid()}
          >
            {loading ? (
              <>
                <FiClock className="spin" />
                Processing...
              </>
            ) : (
              <>
                Pay ₹{order.totalAmount.toFixed(2)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;