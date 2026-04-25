// frontend/src/pages/CreateService.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaTimes, FaImage } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const CreateService = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'development',
    deliveryTime: 3,
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadError, setUploadError] = useState('');

  // Theme-based classes
  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const textMuted = isDark ? 'text-gray-500' : 'text-gray-400';
  const textError = isDark ? 'text-red-400' : 'text-red-600';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-300';
  const inputBg = isDark ? 'bg-gray-700' : 'bg-white';
  const inputText = isDark ? 'text-white' : 'text-gray-900';
  const placeholderColor = isDark ? 'placeholder-gray-400' : 'placeholder-gray-500';
  const labelColor = isDark ? 'text-gray-300' : 'text-gray-700';

  if (!user || (user.role !== 'seller' && user.role !== 'both')) {
    navigate('/');
    return null;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count
    if (imagePreviews.length + files.length > 5) {
      setUploadError('You can only upload up to 5 images');
      return;
    }
    
    // Validate each file
    const validFiles = [];
    const validPreviews = [];
    let hasError = false;
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setUploadError(`${file.name} is not an image file`);
        hasError = true;
        continue;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setUploadError(`${file.name} is too large. Max 5MB per image`);
        hasError = true;
        continue;
      }
      
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }
    
    if (!hasError) {
      setUploadError('');
      setImages([...images, ...validFiles]);
      setImagePreviews([...imagePreviews, ...validPreviews]);
    }
    
    // Clear the input value so the same file can be selected again if needed
    e.target.value = '';
  };

  const removeImage = (index) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    
    const newImages = [...images];
    const newPreviews = [...imagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setImages(newImages);
    setImagePreviews(newPreviews);
    setUploadError('');
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (images.length === 0) {
    toast.error('Please upload at least one image');
    return;
  }
  
  setLoading(true);

  const data = new FormData();
  data.append('title', formData.title);
  data.append('description', formData.description);
  data.append('price', formData.price);
  data.append('category', formData.category);
  data.append('deliveryTime', formData.deliveryTime);
  images.forEach((img) => data.append('images', img));

  try {
    const response = await axios.post('/services', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    console.log('Upload response:', response.data);
    toast.success('Service created successfully!');
    navigate('/dashboard');
  } catch (error) {
    console.error('Upload error details:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.message || error.message || 'Failed to create service';
    toast.error(errorMsg);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className={`min-h-screen ${bgColor} py-8 transition-colors duration-200`}>
      <div className="max-w-3xl mx-auto px-4">
        <div className={`${cardBg} rounded-lg shadow-lg p-6 md:p-8 transition-colors duration-200`}>
          <h1 className={`text-3xl font-bold mb-8 ${textPrimary}`}>Create New Service</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${labelColor}`}>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor} transition-colors duration-200`}
                placeholder="e.g., I will build a modern React website"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${labelColor}`}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="6"
                className={`w-full px-4 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor} transition-colors duration-200`}
                placeholder="Describe what you'll deliver..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelColor}`}>Price (ETB)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor} transition-colors duration-200`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${labelColor}`}>Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} transition-colors duration-200`}
                >
                  <option value="design">Design</option>
                  <option value="development">Development</option>
                  <option value="tutoring">Tutoring</option>
                  <option value="photography">Photography</option>
                  <option value="writing">Writing</option>
                  <option value="marketing">Marketing</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${labelColor}`}>Delivery Time (days)</label>
              <input
                type="number"
                name="deliveryTime"
                value={formData.deliveryTime}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} ${placeholderColor} transition-colors duration-200`}
              />
            </div>

            {/* Image Upload Section */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${labelColor}`}>Images</label>
              
              {/* Image Preview Grid */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Upload Button */}
              <div className={`border-2 border-dashed ${borderColor} rounded-lg p-6 text-center transition-colors duration-200`}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <FaImage className={`text-3xl ${textMuted}`} />
                  <span className={`text-sm ${textSecondary}`}>
                    Click to upload images
                  </span>
                  <span className={`text-xs ${textMuted}`}>
                    PNG, JPG, GIF up to 5MB each (max 5 images)
                  </span>
                </label>
              </div>
              
              {uploadError && (
                <p className={`text-sm ${textError} mt-2`}>{uploadError}</p>
              )}
              <p className={`text-sm ${textMuted} mt-1`}>
                {imagePreviews.length}/5 images selected
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                'Create Service'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateService;