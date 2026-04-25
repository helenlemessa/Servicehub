// backend/routes/search.js - FINAL VERSION
const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const User = require('../models/User');

// Combined search - Searches in title, description, AND category
router.get('/', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, sortBy, type } = req.query;
    
    console.log('📝 Search request:', { q, category, minPrice, maxPrice, sortBy, type });
    
    const results = {};
    
    // Build service filter
    const serviceFilter = { status: 'active' };
    
    // Add search query if provided - Search in title, description, AND category
    if (q && q.trim().length > 0) {
      const searchRegex = new RegExp(q, 'i');
      serviceFilter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex }  // Also search in category field
      ];
      console.log('🔍 Searching for:', q);
    }
    
    // Apply category filter (independent of search query)
    if (category && category !== 'all') {
      serviceFilter.category = category;
      console.log('🏷️ Filtering by category:', category);
    }
    
    // Apply price filters
    if (minPrice || maxPrice) {
      serviceFilter.price = {};
      if (minPrice) serviceFilter.price.$gte = Number(minPrice);
      if (maxPrice) serviceFilter.price.$lte = Number(maxPrice);
      console.log('💰 Price range:', minPrice || '0', '-', maxPrice || '∞');
    }
    
    // Search Services
    if (!type || type === 'all' || type === 'services') {
      console.log('🔎 Service filter:', JSON.stringify(serviceFilter, null, 2));
      
      let serviceQuery = Service.find(serviceFilter)
        .populate('seller', 'name profilePicture rating location headline totalReviews');
      
      // Apply sorting
      if (sortBy === 'price_asc') serviceQuery = serviceQuery.sort('price');
      else if (sortBy === 'price_desc') serviceQuery = serviceQuery.sort('-price');
      else if (sortBy === 'newest') serviceQuery = serviceQuery.sort('-createdAt');
      else serviceQuery = serviceQuery.sort('-createdAt');
      
      results.services = await serviceQuery.limit(50);
      console.log(`✅ Found ${results.services.length} services`);
      
      // Log found services for debugging
      if (results.services.length > 0) {
        results.services.forEach(s => {
          console.log(`   - "${s.title}" (category: ${s.category})`);
        });
      }
    }
    
    // Search Users (only if there's a search query)
    if ((!type || type === 'all' || type === 'users') && q && q.trim().length > 0) {
      const searchRegex = new RegExp(q, 'i');
      const userFilter = {
        $or: [
          { name: searchRegex },
          { headline: searchRegex },
          { bio: searchRegex },
        ]
      };
      
      results.users = await User.find(userFilter)
        .select('name profilePicture headline rating totalReviews location skills bio')
        .limit(50);
      console.log(`✅ Found ${results.users.length} users`);
    } else {
      results.users = [];
    }
    
    // Ensure results arrays exist
    if (!results.services) results.services = [];
    if (!results.users) results.users = [];
    
    res.json(results);
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Autocomplete suggestions
router.get('/suggest', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ services: [], users: [] });
    }
    
    const searchRegex = new RegExp(q, 'i');
    
    const [services, users] = await Promise.all([
      Service.find({ 
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { category: searchRegex }
        ],
        status: 'active' 
      })
        .populate('seller', 'name')
        .limit(5)
        .select('title seller category'),
      User.find({ name: searchRegex })
        .select('name profilePicture headline')
        .limit(5)
    ]);
    
    console.log(`💡 Suggestions - Services: ${services.length}, Users: ${users.length}`);
    
    res.json({ services, users });
  } catch (error) {
    console.error('❌ Search suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint - Check what categories exist in your database
router.get('/debug/categories', async (req, res) => {
  try {
    const categories = await Service.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint - Check what posts exist for a category
router.get('/debug/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const posts = await Service.find({ 
      category: category,
      status: 'active' 
    }).limit(10).select('title category description');
    res.json({ 
      requestedCategory: category,
      count: posts.length,
      posts 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;