const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Order = require('../models/Order');
const Service = require('../models/Service');
const Notification = require('../models/Notification');

// Create order
router.post('/', protect, async (req, res) => {
  try {
    const { serviceId, requirements } = req.body;
    
    const service = await Service.findById(serviceId).populate('seller', 'name email');
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Check if user is trying to order their own service
    if (service.seller._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot order your own service' });
    }
    
    const order = await Order.create({
      service: serviceId,
      buyer: req.user._id,
      seller: service.seller._id,
      amount: service.price,
      requirements: requirements || '',
    });
    
    // Populate order details
    const populatedOrder = await Order.findById(order._id)
      .populate('service', 'title images price')
      .populate('buyer', 'name profilePicture')
      .populate('seller', 'name profilePicture');
    
    // Create notification for seller with link to order
    const notification = await Notification.create({
      recipient: service.seller._id,
      sender: req.user._id,
      type: 'order_placed',
      content: `${req.user.name} placed an order for your service: ${service.title}`,
      targetId: order._id,
      targetModel: 'Order',
      targetUrl: `/dashboard?tab=received` // Direct to orders received tab
    });
    
    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'name profilePicture');
      io.to(`user_${service.seller._id}`).emit('new_notification', populatedNotification);
    }
    
    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get my orders (as buyer)
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('service', 'title images price description')
      .populate('seller', 'name profilePicture')
      .sort('-createdAt');
    
    res.json(orders);
  } catch (error) {
    console.error('Fetch my orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get orders received (as seller)
router.get('/received-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.user._id })
      .populate('service', 'title images price description')
      .populate('buyer', 'name profilePicture')
      .sort('-createdAt');
    
    res.json(orders);
  } catch (error) {
    console.error('Fetch received orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single order
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('service', 'title images price description seller')
      .populate('buyer', 'name profilePicture email')
      .populate('seller', 'name profilePicture email');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check authorization
    if (order.buyer._id.toString() !== req.user._id.toString() && 
        order.seller._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Fetch order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status
router.put('/:id', protect, async (req, res) => {
  try {
    const { status, delivery } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('service', 'title')
      .populate('buyer', 'name')
      .populate('seller', 'name');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check authorization
    if (order.buyer._id.toString() !== req.user._id.toString() && 
        order.seller._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // If seller is completing the order
    if (status === 'completed' && order.seller._id.toString() === req.user._id.toString()) {
      order.delivery = {
        file: delivery?.file,
        message: delivery?.message,
        deliveredAt: new Date(),
      };
      order.completedAt = new Date();
      
      // Create notification for buyer
      const notification = await Notification.create({
        recipient: order.buyer._id,
        sender: req.user._id,
        type: 'order_placed',
        content: `${req.user.name} has completed your order for "${order.service.title}". Please review the delivery.`,
        targetId: order._id,
        targetModel: 'Order',
        targetUrl: `/dashboard?tab=placed`
      });
      
      const io = req.app.get('io');
      if (io) {
        const populatedNotification = await Notification.findById(notification._id)
          .populate('sender', 'name profilePicture');
        io.to(`user_${order.buyer._id}`).emit('new_notification', populatedNotification);
      }
    }
    
    order.status = status;
    await order.save();
    
    res.json(order);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;