import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaStar, FaMapMarkerAlt, FaUser, FaClock, FaShoppingCart } from 'react-icons/fa';

const ServiceDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState('');
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    fetchService();
  }, [id]);

  const fetchService = async () => {
    try {
      const { data } = await axios.get(`/services/${id}`);
      setService(data);
    } catch (error) {
      console.error('Fetch service error:', error);
      toast.error('Service not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to order');
      navigate('/login');
      return;
    }

    if (user._id === service.seller._id) {
      toast.error('You cannot order your own service');
      return;
    }

    setOrdering(true);
    try {
      await axios.post('/orders', {
        serviceId: service._id,
        requirements,
      });
      toast.success('Order placed successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!service) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Images */}
          {service.images && service.images.length > 0 && (
            <div className="mb-6">
              <img
                src={service.images[0]}
                alt={service.title}
                className="w-full h-96 object-cover rounded-lg"
              />
              {service.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {service.images.slice(1).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${service.title} ${idx + 2}`}
                      className="w-full h-24 object-cover rounded"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Title & Description */}
          <h1 className="text-3xl font-bold mb-4">{service.title}</h1>
          <p className="text-gray-700 mb-6 leading-relaxed">{service.description}</p>

          {/* Seller Info */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">About the Seller</h2>
            <div className="flex items-center mb-4">
              {service.seller?.profilePicture ? (
                <img
                  src={service.seller.profilePicture}
                  alt={service.seller.name}
                  className="w-16 h-16 rounded-full object-cover mr-4"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl mr-4">
                  {service.seller?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">{service.seller?.name}</h3>
                <div className="flex items-center text-sm text-gray-600">
                  <FaStar className="text-yellow-400 mr-1" />
                  <span>{service.seller?.rating?.toFixed(1) || 'New'}</span>
                  <span className="mx-2">•</span>
                  <span>{service.seller?.totalReviews || 0} reviews</span>
                </div>
              </div>
            </div>
            <p className="text-gray-600">{service.seller?.bio || 'No bio provided'}</p>
          </div>
        </div>

        {/* Sidebar - Order Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
            <div className="mb-6">
              <span className="text-3xl font-bold text-blue-600">{service.price} ETB</span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center text-gray-600">
                <FaClock className="mr-2" />
                <span>Delivery in {service.deliveryTime || 3} days</span>
              </div>
              <div className="flex items-center text-gray-600">
                <FaMapMarkerAlt className="mr-2" />
                <span>{service.seller?.location?.city || 'Addis Ababa'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <FaUser className="mr-2" />
                <span>{service.views || 0} views</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Additional Requirements (Optional)
              </label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe any specific requirements for this order..."
              />
            </div>

            <button
              onClick={handleOrder}
              disabled={ordering || user?._id === service.seller?._id}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FaShoppingCart />
              {ordering ? 'Placing Order...' : 'Order Now'}
            </button>

            <button
              onClick={() => navigate(`/chat/${service.seller?._id}`)}
              className="w-full mt-3 border border-blue-500 text-blue-500 py-3 rounded-lg hover:bg-blue-50 transition"
            >
              Contact Seller
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;