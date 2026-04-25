import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaShoppingCart, FaArrowLeft } from 'react-icons/fa';

const OrderPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState('');
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchService();
  }, [id, isAuthenticated]);

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
    if (user._id === service?.seller?._id) {
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
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!service) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <FaArrowLeft /> Back
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">Place Order</h1>
          <p className="text-gray-600 mt-1">Complete the form below to order this service</p>
        </div>

        <div className="p-6">
          {/* Service Details */}
          <div className="flex gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            {service.images && service.images[0] ? (
              <img
                src={service.images[0]}
                alt={service.title}
                className="w-24 h-24 object-cover rounded"
              />
            ) : (
              <div className="w-24 h-24 bg-blue-500 rounded flex items-center justify-center text-white text-2xl">
                📦
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{service.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{service.description?.substring(0, 150)}...</p>
              <div className="mt-2">
                <span className="text-2xl font-bold text-blue-600">{service.price} ETB</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Seller: {service.seller?.name}
              </p>
            </div>
          </div>

          {/* Order Form */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Requirements (Optional)
            </label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows="5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Please describe your requirements, deadlines, or any specific instructions for this order..."
            />
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4 mb-6">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Service Price:</span>
              <span className="font-medium">{service.price} ETB</span>
            </div>
            <div className="flex justify-between py-2 border-t">
              <span className="text-gray-600">Total:</span>
              <span className="text-xl font-bold text-blue-600">{service.price} ETB</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleOrder}
              disabled={ordering}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FaShoppingCart />
              {ordering ? 'Placing Order...' : 'Confirm Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;