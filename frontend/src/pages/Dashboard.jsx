import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaSun, FaMoon } from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [myServices, setMyServices] = useState([]);
  const [ordersReceived, setOrdersReceived] = useState([]);
  const [ordersPlaced, setOrdersPlaced] = useState([]);
  const [activeTab, setActiveTab] = useState('services');
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', price: '' });

  // Theme-based classes
  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-300' : 'text-gray-600';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const inputBg = isDark ? 'bg-gray-700' : 'bg-white';
  const inputText = isDark ? 'text-white' : 'text-gray-900';
  const placeholderColor = isDark ? 'placeholder-gray-400' : 'placeholder-gray-500';
  const inputBorder = isDark ? 'border-gray-600' : 'border-gray-300';
  const modalBg = isDark ? 'bg-gray-800' : 'bg-white';

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (user?.role === 'seller' || user?.role === 'both') {
        await Promise.all([
          fetchMyServices(),
          fetchOrdersReceived(),
          fetchOrdersPlaced()
        ]);
      } else {
        await fetchOrdersPlaced();
      }
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyServices = async () => {
    try {
      const { data } = await axios.get('/services/my-services');
      setMyServices(data);
    } catch (error) {
      console.error('Fetch services error:', error);
      toast.error('Failed to load your services');
    }
  };

  const fetchOrdersReceived = async () => {
    try {
      const { data } = await axios.get('/orders/received-orders');
      setOrdersReceived(data);
    } catch (error) {
      console.error('Fetch orders error:', error);
      toast.error('Failed to load received orders');
    }
  };

  const fetchOrdersPlaced = async () => {
    try {
      const { data } = await axios.get('/orders/my-orders');
      setOrdersPlaced(data);
    } catch (error) {
      console.error('Fetch orders error:', error);
      toast.error('Failed to load your orders');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`/orders/${orderId}`, { status });
      toast.success(`Order ${status.replace('_', ' ')} successfully`);
      fetchOrdersReceived();
      fetchOrdersPlaced();
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const deleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await axios.delete(`/services/${serviceId}`);
        toast.success('Service deleted successfully');
        fetchMyServices();
      } catch (error) {
        toast.error('Failed to delete service');
      }
    }
  };

  const handleEditClick = (service) => {
    setEditingService(service);
    setEditForm({
      title: service.title,
      description: service.description,
      price: service.price
    });
  };

  const handleUpdateService = async () => {
    try {
      await axios.put(`/services/${editingService._id}`, {
        title: editForm.title,
        description: editForm.description,
        price: editForm.price
      });
      toast.success('Service updated successfully');
      setEditingService(null);
      fetchMyServices();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update service');
    }
  };

  const totalSales = ordersReceived
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + (order.amount || 0), 0);
  
  const activeOrders = ordersReceived.filter(
    o => o.status !== 'completed' && o.status !== 'cancelled'
  ).length;

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className={`max-w-7xl mx-auto px-4 py-8 ${bgColor}`}>
        <div className={`text-center py-12 ${textSecondary}`}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 py-8 ${bgColor} min-h-screen transition-colors duration-200`}>
      <h1 className={`text-3xl font-bold mb-8 ${textPrimary}`}>Dashboard</h1>

      {/* Stats Cards */}
      {(user?.role === 'seller' || user?.role === 'both') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`${cardBg} p-6 rounded-lg shadow-md transition-colors duration-200`}>
            <h3 className={`${textMuted} text-sm mb-2`}>Total Sales</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalSales} ETB</p>
            <p className={`text-xs ${textMuted} mt-1`}>From completed orders</p>
          </div>
          <div className={`${cardBg} p-6 rounded-lg shadow-md transition-colors duration-200`}>
            <h3 className={`${textMuted} text-sm mb-2`}>Active Orders</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeOrders}</p>
          </div>
          <div className={`${cardBg} p-6 rounded-lg shadow-md transition-colors duration-200`}>
            <h3 className={`${textMuted} text-sm mb-2`}>Services Listed</h3>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{myServices.length}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={`border-b ${borderColor} mb-6`}>
        <div className="flex space-x-4 overflow-x-auto">
          {(user?.role === 'seller' || user?.role === 'both') && (
            <>
              <button
                onClick={() => setActiveTab('services')}
                className={`py-2 px-4 whitespace-nowrap transition ${
                  activeTab === 'services' 
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium' 
                    : `${textMuted} hover:${textSecondary}`
                }`}
              >
                My Services ({myServices.length})
              </button>
              <button
                onClick={() => setActiveTab('received')}
                className={`py-2 px-4 whitespace-nowrap transition ${
                  activeTab === 'received' 
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium' 
                    : `${textMuted} hover:${textSecondary}`
                }`}
              >
                Orders Received ({ordersReceived.length})
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('placed')}
            className={`py-2 px-4 whitespace-nowrap transition ${
              activeTab === 'placed' 
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium' 
                : `${textMuted} hover:${textSecondary}`
            }`}
          >
            Orders Placed ({ordersPlaced.length})
          </button>
        </div>
      </div>

      {/* My Services Tab */}
      {activeTab === 'services' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-semibold ${textPrimary}`}>My Services</h2>
            <Link
              to="/create-service"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm"
            >
              + New Service
            </Link>
          </div>
          
          {myServices.length === 0 ? (
            <div className={`${cardBg} rounded-lg shadow p-8 text-center transition-colors duration-200`}>
              <p className={`${textMuted} mb-4`}>You haven't created any services yet</p>
              <Link
                to="/create-service"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 inline-block"
              >
                Create Your First Service
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {myServices.map((service) => (
                <div key={service._id} className={`${cardBg} p-4 rounded-lg shadow hover:shadow-md transition-all duration-200`}>
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg ${textPrimary}`}>{service.title}</h3>
                      <p className={`${textSecondary} text-sm mt-1 line-clamp-2`}>{service.description}</p>
                      <div className="flex items-center mt-2 space-x-4 flex-wrap gap-2">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{service.price} ETB</span>
                        <span className={`text-sm ${textMuted} capitalize`}>{service.category}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          service.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {service.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/services/${service._id}`}
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleEditClick(service)}
                        className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteService(service._id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orders Received Tab */}
      {activeTab === 'received' && (
        <div>
          <h2 className={`text-xl font-semibold mb-4 ${textPrimary}`}>Orders Received</h2>
          {ordersReceived.length === 0 ? (
            <div className={`${cardBg} rounded-lg shadow p-8 text-center transition-colors duration-200`}>
              <p className={textMuted}>No orders received yet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {ordersReceived.map((order) => (
                <div key={order._id} className={`${cardBg} p-4 rounded-lg shadow transition-colors duration-200`}>
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex-1">
                      <h3 className={`font-semibold ${textPrimary}`}>{order.service?.title || 'Service'}</h3>
                      <p className={`text-sm ${textSecondary} mt-1`}>
                        Buyer: {order.buyer?.name}
                      </p>
                      <p className={`text-sm ${textSecondary}`}>
                        Amount: <span className="font-bold text-blue-600 dark:text-blue-400">{order.amount} ETB</span>
                      </p>
                      <p className={`text-sm ${textSecondary}`}>
                        Ordered: {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      {order.requirements && (
                        <div className={`mt-2 p-2 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                          <p className={`text-xs ${textMuted} font-medium`}>Requirements:</p>
                          <p className={`text-sm ${textSecondary}`}>{order.requirements}</p>
                        </div>
                      )}
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'in_progress')}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                        >
                          Accept Order
                        </button>
                      )}
                      {order.status === 'in_progress' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'completed')}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                        >
                          Mark Complete
                        </button>
                      )}
                      <Link
                        to={`/chat/${order.buyer?._id}`}
                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                      >
                        Message
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orders Placed Tab */}
      {activeTab === 'placed' && (
        <div>
          <h2 className={`text-xl font-semibold mb-4 ${textPrimary}`}>Orders Placed</h2>
          {ordersPlaced.length === 0 ? (
            <div className={`${cardBg} rounded-lg shadow p-8 text-center transition-colors duration-200`}>
              <p className={textMuted}>You haven't placed any orders yet</p>
              <Link to="/" className="text-blue-500 hover:underline mt-2 inline-block">
                Browse Services
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {ordersPlaced.map((order) => (
                <div key={order._id} className={`${cardBg} p-4 rounded-lg shadow transition-colors duration-200`}>
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex-1">
                      <h3 className={`font-semibold ${textPrimary}`}>{order.service?.title || 'Service'}</h3>
                      <p className={`text-sm ${textSecondary} mt-1`}>
                        Seller: {order.seller?.name}
                      </p>
                      <p className={`text-sm ${textSecondary}`}>
                        Amount: <span className="font-bold text-blue-600 dark:text-blue-400">{order.amount} ETB</span>
                      </p>
                      <p className={`text-sm ${textSecondary}`}>
                        Ordered: {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      {order.requirements && (
                        <div className={`mt-2 p-2 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                          <p className={`text-xs ${textMuted} font-medium`}>Requirements:</p>
                          <p className={`text-sm ${textSecondary}`}>{order.requirements}</p>
                        </div>
                      )}
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {order.status === 'completed' && (
                        <Link
                          to={`/review/${order._id}`}
                          className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                        >
                          Leave Review
                        </Link>
                      )}
                      <Link
                        to={`/chat/${order.seller?._id}`}
                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                      >
                        Message
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Service Modal - FIXED with dark mode */}
      {editingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${modalBg} rounded-lg max-w-md w-full p-6 transition-colors duration-200`}>
            <h2 className={`text-xl font-semibold mb-4 ${textPrimary}`}>Edit Service</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className={`w-full px-3 py-2 border ${inputBorder} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor} transition-colors duration-200`}
                  placeholder="Service title"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows="4"
                  className={`w-full px-3 py-2 border ${inputBorder} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor} transition-colors duration-200`}
                  placeholder="Service description"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Price (ETB)</label>
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  className={`w-full px-3 py-2 border ${inputBorder} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor} transition-colors duration-200`}
                  placeholder="Price"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setEditingService(null)}
                  className={`flex-1 px-4 py-2 border ${borderColor} rounded-lg ${textSecondary} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateService}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;