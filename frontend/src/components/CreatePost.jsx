import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaImage, FaTimes } from 'react-icons/fa';

const CreatePost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Theme-based classes
  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-300' : 'text-gray-600';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const inputBg = isDark ? 'bg-gray-700' : 'bg-white';
  const inputText = isDark ? 'text-white' : 'text-gray-900';
  const placeholderColor = isDark ? 'placeholder-gray-400' : 'placeholder-gray-500';
  const modalBg = isDark ? 'bg-gray-800' : 'bg-white';
  const headerBg = isDark ? 'bg-gray-800' : 'bg-white';
  const buttonHover = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100';

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      toast.error('Please add some content or images');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title', content.slice(0, 100));
    formData.append('description', content);
    formData.append('price', 0);
    formData.append('category', 'other');
    images.forEach(img => formData.append('images', img));

    try {
      await axios.post('/services', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Post created successfully!');
      setContent('');
      setImages([]);
      setShowModal(false);
      onPostCreated();
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Create Post Card */}
      <div className={`${cardBg} rounded-lg shadow p-4 mb-4 cursor-pointer transition-colors duration-200`} onClick={() => setShowModal(true)}>
        <div className="flex items-center gap-3">
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className={`flex-1 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full px-4 py-2 ${textMuted} ${buttonHover} transition cursor-pointer`}>
            Start a post...
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${modalBg} rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-200`}>
            <div className={`p-4 border-b ${borderColor} flex justify-between items-center sticky top-0 ${headerBg}`}>
              <h2 className={`text-xl font-semibold ${textPrimary}`}>Create a post</h2>
              <button
                onClick={() => setShowModal(false)}
                className={`p-2 ${buttonHover} rounded-full ${textSecondary}`}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className={`font-semibold ${textPrimary}`}>{user?.name}</p>
                  <p className={`text-xs ${textMuted}`}>Post to everyone</p>
                </div>
              </div>
              
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What do you want to share?"
                className={`w-full p-3 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] ${inputBg} ${inputText} ${placeholderColor} transition-colors duration-200`}
              />
              
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`Preview ${idx}`}
                        className="w-full h-32 object-cover rounded"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600 transition"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t ${borderColor}">
                <label className={`cursor-pointer p-2 ${buttonHover} rounded-full transition`}>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <FaImage className="text-green-500 text-xl" />
                </label>
                
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 transition"
                >
                  {loading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreatePost;