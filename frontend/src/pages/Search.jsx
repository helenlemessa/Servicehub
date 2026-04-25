// frontend/src/pages/Search.jsx - WITH DARK MODE SUPPORT
import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSearch, FaFilter, FaTimes, FaUser, FaBriefcase, FaStar, FaMapMarkerAlt, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || 'all';
  const typeParam = searchParams.get('type') || 'all';
  
  const [searchQuery, setSearchQuery] = useState(query);
  const [activeTab, setActiveTab] = useState(typeParam);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  
  // Theme-based classes
  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-500';
  const textMuted = isDark ? 'text-gray-500' : 'text-gray-400';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const inputBg = isDark ? 'bg-gray-800' : 'bg-white';
  const inputBorder = isDark ? 'border-gray-700' : 'border-gray-300';
  const inputText = isDark ? 'text-white' : 'text-gray-900';
  const placeholderColor = isDark ? 'placeholder-gray-500' : 'placeholder-gray-400';
  const hoverBg = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const filterBg = isDark ? 'bg-gray-800' : 'bg-gray-50';
  const tabActive = isDark ? 'text-blue-400 border-blue-400' : 'text-blue-600 border-blue-600';
  const tabInactive = isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700';
  const categoryBadge = isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700';
  
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'design', label: 'Design' },
    { value: 'development', label: 'Development' },
    { value: 'tutoring', label: 'Tutoring' },
    { value: 'photography', label: 'Photography' },
    { value: 'writing', label: 'Writing' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, selectedCategory, minPrice, maxPrice, sortBy]);

  const performSearch = async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      
      if (searchQuery.trim()) {
        params.append('q', searchQuery);
      }
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sortBy !== 'relevance') params.append('sortBy', sortBy);
      if (activeTab !== 'all') params.append('type', activeTab);
      
      console.log('Search params:', params.toString());
      
      const { data } = await axios.get(`/search?${params.toString()}`);
      console.log('Search results:', data);
      
      setServices(data.services || []);
      setUsers(data.users || []);
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch();
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('relevance');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const totalResults = services.length + users.length;

  return (
    <div className={`min-h-screen ${bgColor} transition-colors duration-200`}>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Back Button for Mobile */}
        <button
          onClick={() => navigate(-1)}
          className={`md:hidden flex items-center gap-2 ${textSecondary} mb-4`}
        >
          <FaArrowLeft size={16} /> Back
        </button>

        {/* Search Header */}
        <div className={`${cardBg} rounded-lg shadow p-4 md:p-6 mb-6 transition-colors duration-200`}>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${textMuted}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for services or users..."
                className={`w-full pl-10 pr-4 py-3 border ${inputBorder} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${inputBg} ${inputText} ${placeholderColor} transition-colors duration-200`}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 md:flex-none px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 text-sm font-medium"
              >
                <FaSearch /> Search
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex-1 md:flex-none px-6 py-3 border ${borderColor} ${cardBg} ${textPrimary} rounded-lg ${hoverBg} transition flex items-center justify-center gap-2 text-sm`}
              >
                <FaFilter /> Filters
              </button>
            </div>
          </form>
          
          {/* Filters Panel */}
          {showFilters && (
            <div className={`mt-4 p-4 ${filterBg} rounded-lg transition-colors duration-200`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textPrimary}`}>Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={`w-full p-2 border ${inputBorder} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${inputBg} ${inputText} transition-colors duration-200`}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textPrimary}`}>Min Price (ETB)</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    className={`w-full p-2 border ${inputBorder} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${inputBg} ${inputText} ${placeholderColor} transition-colors duration-200`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textPrimary}`}>Max Price (ETB)</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Any"
                    className={`w-full p-2 border ${inputBorder} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${inputBg} ${inputText} ${placeholderColor} transition-colors duration-200`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textPrimary}`}>Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={`w-full p-2 border ${inputBorder} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${inputBg} ${inputText} transition-colors duration-200`}
                  >
                    <option value="relevance">Relevance</option>
                    <option value="newest">Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-500 hover:text-blue-600"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {!loading && query && (
          <div className={`mb-4 text-sm ${textSecondary}`}>
            Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
          </div>
        )}

        {/* Tabs */}
        {!loading && totalResults > 0 && (
          <div className={`flex border-b ${borderColor} mb-6 overflow-x-auto`}>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base whitespace-nowrap transition ${
                activeTab === 'all' ? tabActive : tabInactive
              }`}
            >
              All ({totalResults})
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base whitespace-nowrap transition ${
                activeTab === 'services' ? tabActive : tabInactive
              }`}
            >
              Services ({services.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base whitespace-nowrap transition ${
                activeTab === 'users' ? tabActive : tabInactive
              }`}
            >
              Users ({users.length})
            </button>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`${cardBg} rounded-lg shadow p-4 animate-pulse`}>
                <div className="flex gap-4">
                  <div className={`w-20 h-20 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
                  <div className="flex-1">
                    <div className={`h-5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/3 mb-2`}></div>
                    <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-2/3`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (activeTab === 'all' || activeTab === 'services') && services.length === 0 && (activeTab === 'all' || activeTab === 'users') && users.length === 0 ? (
          <div className={`${cardBg} rounded-lg shadow p-12 text-center`}>
            <FaSearch className={`mx-auto text-5xl ${isDark ? 'text-gray-600' : 'text-gray-300'} mb-4`} />
            <h3 className={`text-lg font-medium ${textPrimary} mb-1`}>No results found</h3>
            <p className={textSecondary}>
              We couldn't find any matches for "{query}"
            </p>
            <p className={`text-sm ${textMuted} mt-2`}>
              Try different keywords or check your spelling
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Services Results */}
            {(activeTab === 'all' || activeTab === 'services') && services.map((service) => (
              <div
                key={service._id}
                className={`${cardBg} rounded-lg shadow hover:shadow-md transition cursor-pointer`}
                onClick={() => navigate(`/services/${service._id}`)}
              >
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {service.images && service.images[0] ? (
                      <img
                        src={service.images[0]}
                        alt={service.title}
                        className="w-full sm:w-24 h-48 sm:h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className={`w-full sm:w-24 h-48 sm:h-24 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                        <FaBriefcase className={`text-3xl ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <h3 className={`font-semibold text-lg ${textPrimary} hover:text-blue-600 line-clamp-1`}>
                            {service.title}
                          </h3>
                          <Link
                            to={`/profile/${service.seller?._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className={`flex items-center gap-1 text-sm ${textSecondary} hover:text-blue-500 mt-1`}
                          >
                            {service.seller?.profilePicture ? (
                              <img
                                src={service.seller.profilePicture}
                                alt={service.seller.name}
                                className="w-5 h-5 rounded-full"
                              />
                            ) : (
                              <FaUser size={12} />
                            )}
                            {service.seller?.name}
                          </Link>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-xl font-bold text-green-600">
                            {formatPrice(service.price)}
                          </span>
                          <p className={`text-xs ${textMuted} mt-1`}>
                            Posted {formatRelativeTime(service.createdAt)}
                          </p>
                        </div>
                      </div>
                      <p className={`${textSecondary} text-sm mt-2 line-clamp-2`}>
                        {service.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className={`text-xs ${categoryBadge} px-2 py-1 rounded`}>
                          {categories.find(c => c.value === service.category)?.label || service.category}
                        </span>
                        <div className={`flex items-center gap-1 text-sm ${textSecondary}`}>
                          <FaStar className="text-yellow-400" />
                          <span>{service.seller?.rating || 0}</span>
                          <span className="text-xs">({service.seller?.totalReviews || 0})</span>
                        </div>
                        {service.seller?.location?.city && (
                          <div className={`flex items-center gap-1 text-xs ${textMuted}`}>
                            <FaMapMarkerAlt size={10} />
                            {service.seller.location.city}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Users Results */}
            {(activeTab === 'all' || activeTab === 'users') && users.map((userItem) => (
              <div
                key={userItem._id}
                className={`${cardBg} rounded-lg shadow hover:shadow-md transition cursor-pointer`}
                onClick={() => navigate(`/profile/${userItem._id}`)}
              >
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {userItem.profilePicture ? (
                      <img
                        src={userItem.profilePicture}
                        alt={userItem.name}
                        className="w-16 h-16 rounded-full object-cover mx-auto sm:mx-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto sm:mx-0">
                        {userItem.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <h3 className={`font-semibold text-lg ${textPrimary} hover:text-blue-600`}>
                            {userItem.name}
                          </h3>
                          <p className={`text-sm ${textSecondary}`}>
                            {userItem.headline || 'No headline'}
                          </p>
                        </div>
                        <div className="flex items-center justify-center sm:justify-end gap-1">
                          <FaStar className="text-yellow-400" />
                          <span className={`text-sm font-medium ${textPrimary}`}>{userItem.rating || 0}</span>
                          <span className={`text-xs ${textMuted}`}>
                            ({userItem.totalReviews || 0} reviews)
                          </span>
                        </div>
                      </div>
                      {userItem.bio && (
                        <p className={`${textSecondary} text-sm mt-2 line-clamp-1`}>
                          {userItem.bio}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                        {userItem.location?.city && (
                          <div className={`flex items-center gap-1 text-xs ${textMuted}`}>
                            <FaMapMarkerAlt size={10} />
                            {userItem.location.city}, {userItem.location.country}
                          </div>
                        )}
                        {userItem.skills && userItem.skills.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className={`text-xs ${categoryBadge} px-2 py-1 rounded`}>
                            {skill}
                          </span>
                        ))}
                        {userItem.skills?.length > 3 && (
                          <span className={`text-xs ${textMuted}`}>
                            +{userItem.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;