const express = require('express');
const { query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

const router = express.Router();

function parseDateRange(req) {
  const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const to = req.query.to ? new Date(req.query.to) : new Date();
  // Normalize to range bounds
  if (!isNaN(from)) from.setHours(0, 0, 0, 0);
  if (!isNaN(to)) to.setHours(23, 59, 59, 999);
  return { from, to };
}

function getBusinessId(user) {
  return user.currentBusiness || (user.businesses && user.businesses.length > 0 ? user.businesses[0].business : null);
}

// GET /api/sales/summary
router.get('/summary', auth, [
  query('from').optional({ checkFalsy: true }).isISO8601().toDate(),
  query('to').optional({ checkFalsy: true }).isISO8601().toDate(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { from, to } = parseDateRange(req);
    const businessId = getBusinessId(req.user);
    if (!businessId) return res.status(400).json({ message: 'No business context found' });

    // Revenue & payment breakdown from Payments (completed)
    const paymentMatch = {
      business: businessId,
      status: 'completed',
      paymentDate: { $gte: from, $lte: to }
    };

    const [paymentsAgg] = await Payment.aggregate([
      { $match: paymentMatch },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const paymentBreakdown = await Payment.aggregate([
      { $match: paymentMatch },
      { $group: { _id: '$paymentMethod', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $project: { method: '$_id', amount: 1, count: 1, _id: 0 } },
      { $sort: { amount: -1 } }
    ]);

    // Top products from Orders with completed payments
    const topProducts = await Order.aggregate([
      { $match: { business: businessId, paymentStatus: 'completed', createdAt: { $gte: from, $lte: to } } },
      { $unwind: '$products' },
      { $group: { _id: '$products.product', units: { $sum: '$products.quantity' }, revenue: { $sum: '$products.totalPrice' } } },
      { $sort: { units: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { _id: 0, productId: '$product._id', name: '$product.name', units: 1, revenue: 1, category: '$product.category' } }
    ]);

    const totalRevenue = paymentsAgg?.totalRevenue || 0;
    const totalSales = paymentsAgg?.count || 0;
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    res.json({
      range: { from, to },
      totalRevenue,
      totalSales,
      averageOrderValue,
      paymentBreakdown,
      topProducts
    });
  } catch (err) {
    console.error('Sales summary error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/sales/list
router.get('/list', auth, [
  query('from').optional({ checkFalsy: true }).isISO8601().toDate(),
  query('to').optional({ checkFalsy: true }).isISO8601().toDate(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('paymentMethod').optional({ checkFalsy: true }).isIn(['credit_card','debit_card','net_banking','upi','wallet','cod']),
  query('status').optional({ checkFalsy: true }).isIn(['completed','pending','failed','refunded','processing','cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { from, to } = parseDateRange(req);
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const skip = (page - 1) * limit;
    const businessId = getBusinessId(req.user);
    if (!businessId) return res.status(400).json({ message: 'No business context found' });

    const match = {
      business: businessId,
      paymentDate: { $gte: from, $lte: to }
    };
    if (req.query.paymentMethod) match.paymentMethod = req.query.paymentMethod;
    if (req.query.status) match.status = req.query.status;

    const [rows, [{ total = 0 } = {}] = []] = await Promise.all([
      Payment.aggregate([
        { $match: match },
        { $sort: { paymentDate: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $lookup: { from: 'orders', localField: 'order', foreignField: '_id', as: 'order' } },
        { $unwind: '$order' },
        { $project: {
          _id: 1,
          transactionId: 1,
          amount: 1,
          status: 1,
          paymentMethod: 1,
          paymentDate: 1,
          orderId: '$order._id',
          orderNumber: '$order.orderNumber',
          customer: '$order.customer',
          createdAt: 1
        } }
      ]),
      Payment.aggregate([
        { $match: match },
        { $count: 'total' }
      ])
    ]);

    res.json({
      page, limit, total, rows
    });
  } catch (err) {
    console.error('Sales list error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
