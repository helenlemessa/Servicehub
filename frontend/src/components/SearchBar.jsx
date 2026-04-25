// frontend/src/components/SearchBar.jsx - FIXED WITH THEME
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FaSearch, FaTimes, FaUser, FaBriefcase } from 'react-icons/fa';
import axios from 'axios';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState({ services: [], users: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);

  // Determine colors based on theme
  const inputBg = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50';
  const inputText = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const inputBorder = theme === 'dark' ? 'border-gray-600' : 'border-gray-300';
  const placeholderColor = theme === 'dark' ? 'placeholder-gray-400' : 'placeholder-gray-500';
  const suggestionBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const suggestionText = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';
  const suggestionHover = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.trim().length < 2) {
      setSuggestions({ services: [], users: [] });
      setShowSuggestions(false);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/search/suggest?q=${encodeURIComponent(query)}`);
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Fetch suggestions error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
      if (inputRef.current) inputRef.current.blur();
    }
  };

  const handleSuggestionClick = (suggestion, type) => {
    if (type === 'service') {
      navigate(`/services/${suggestion._id}`);
    } else {
      navigate(`/profile/${suggestion._id}`);
    }
    setShowSuggestions(false);
    setQuery('');
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <form onSubmit={handleSearch} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && (suggestions.services?.length > 0 || suggestions.users?.length > 0) && setShowSuggestions(true)}
          placeholder="Search services or users..."
          className={`w-full pl-10 pr-10 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${inputBg} ${inputText} ${inputBorder} ${placeholderColor} transition-colors duration-200`}
        />
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FaTimes size={14} />
          </button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.services?.length > 0 || suggestions.users?.length > 0) && (
        <div className={`absolute top-full left-0 right-0 mt-1 ${suggestionBg} rounded-lg shadow-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} z-50 max-h-96 overflow-y-auto`}>
          {suggestions.services?.length > 0 && (
            <div className="p-2">
              <div className={`px-3 py-1 text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase flex items-center gap-1`}>
                <FaBriefcase size={10} /> Services
              </div>
              {suggestions.services.slice(0, 3).map((service) => (
                <div
                  key={service._id}
                  onClick={() => handleSuggestionClick(service, 'service')}
                  className={`px-3 py-2 ${suggestionHover} cursor-pointer rounded-lg transition`}
                >
                  <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{service.title}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{service.seller?.name}</p>
                </div>
              ))}
            </div>
          )}
          
          {suggestions.users?.length > 0 && (
            <div className={`p-2 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`px-3 py-1 text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase flex items-center gap-1`}>
                <FaUser size={10} /> Users
              </div>
              {suggestions.users.slice(0, 3).map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleSuggestionClick(user, 'user')}
                  className={`px-3 py-2 ${suggestionHover} cursor-pointer rounded-lg transition flex items-center gap-2`}
                >
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{user.headline || 'User'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className={`p-2 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={handleSearch}
              className={`w-full px-3 py-2 text-center text-sm ${theme === 'dark' ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-blue-50'} rounded-lg transition font-medium`}
            >
              See all results for "{query}"
            </button>
          </div>
        </div>
      )}
      
      {loading && (
        <div className={`absolute top-full left-0 right-0 mt-1 ${suggestionBg} rounded-lg shadow-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} z-50 p-4`}>
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loading suggestions...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;