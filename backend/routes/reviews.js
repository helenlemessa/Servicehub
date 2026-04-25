const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');

// Create review
router.post('/', protect, async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only buyer can review' });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'Order must be completed first' });
    }

    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      return res.status(400).json({ message: 'Already reviewed' });
    }

    const review = await Review.create({
      order: orderId,
      reviewer: req.user._id,
      seller: order.seller,
      rating,
      comment,
    });

    // Update seller rating
    const sellerReviews = await Review.find({ seller: order.seller });
    const avgRating = sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length;

    await User.findByIdAndUpdate(order.seller, {
      rating: avgRating,
      totalReviews: sellerReviews.length,
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get seller reviews
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const reviews = await Review.find({ seller: req.params.sellerId })
      .populate('reviewer', 'name profilePicture')
      .sort('-createdAt')
      .limit(20);

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;