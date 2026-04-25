import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaFire, FaArrowTrendUp, FaChartLine, FaHashtag } from 'react-icons/fa6';

const TrendingTopics = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrendingTopics();
  }, [timeframe]);

  const fetchTrendingTopics = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/services/trending/topics?limit=8&timeframe=${timeframe}`);
      setTopics(data);
    } catch (error) {
      console.error('Fetch trending topics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === '🔥 Hot') return <FaFire className="text-red-500" />;
    if (trend === '📈 Rising') return <FaArrowTrendUp className="text-orange-500" />;
    return <FaChartLine className="text-green-500" />;
  };

  const getTrendColor = (trend) => {
    if (trend === '🔥 Hot') return 'text-red-600 bg-red-50';
    if (trend === '📈 Rising') return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const handleTopicClick = (category) => {
    // Navigate to home with category query parameter
    navigate(`/?category=${category}`);
    // Force refresh of the page to trigger the filter
    window.location.href = `/?category=${category}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-3">Trending Topics</h3>
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-lg">Trending Topics</h3>
        <div className="flex gap-1 text-xs">
          <button
            onClick={() => setTimeframe('day')}
            className={`px-2 py-1 rounded transition ${
              timeframe === 'day' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setTimeframe('week')}
            className={`px-2 py-1 rounded transition ${
              timeframe === 'week' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-2 py-1 rounded transition ${
              timeframe === 'month' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Month
          </button>
        </div>
      </div>
      
      {topics.length === 0 ? (
        <div className="text-center py-4 text-gray-400 text-sm">
          No trending topics yet
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map((topic, index) => (
            <button
              key={topic.id}
              onClick={() => handleTopicClick(topic.category)}
              className="w-full text-left hover:bg-gray-50 rounded-lg p-2 transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
                  <FaHashtag className="text-gray-400 text-xs" />
                  <span className="font-medium text-gray-800 group-hover:text-blue-600">
                    {topic.name}
                  </span>
                </div>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getTrendColor(topic.trend)}`}>
                  {getTrendIcon(topic.trend)}
                  <span>{topic.trend}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1 ml-7 text-xs text-gray-400">
                <span>{topic.postCount} posts</span>
                <span>{Math.round(topic.engagement)} engagements</span>
              </div>
            </button>
          ))}
        </div>
      )}
      
      <button
        onClick={fetchTrendingTopics}
        className="w-full mt-3 text-center text-xs text-blue-500 hover:text-blue-700 py-2 border-t mt-3 pt-3"
      >
        Refresh trends
      </button>
    </div>
  );
};

export default TrendingTopics;