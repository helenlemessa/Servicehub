// frontend/src/components/LinkPreview.jsx
import { useState, useEffect } from 'react';
import { FaLink, FaExternalLinkAlt } from 'react-icons/fa';
import axios from 'axios';

const LinkPreview = ({ url, isSender }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true);
        const { data } = await axios.post('/messages/link-preview', { url });
        if (data && data.title) {
          setPreview(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch link preview:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  if (loading) {
    return (
      <div className={`mt-2 p-3 rounded-lg border ${isSender ? 'border-blue-400 bg-blue-600' : 'border-gray-200 bg-gray-50'} animate-pulse`}>
        <div className="flex gap-3">
          <div className="w-16 h-16 bg-gray-300 rounded"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !preview) {
    // Just show the URL as a clickable link
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-2 inline-flex items-center gap-1 text-sm break-all hover:underline ${
          isSender ? 'text-blue-100' : 'text-blue-600'
        }`}
      >
        <FaLink size={12} />
        {url}
        <FaExternalLinkAlt size={10} />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-2 block rounded-lg border overflow-hidden transition hover:shadow-md ${
        isSender ? 'border-blue-400 bg-blue-600' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        {preview.image && (
          <div className="sm:w-24 h-24 bg-gray-100 flex-shrink-0">
            <img
              src={preview.image}
              alt={preview.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="flex-1 p-3">
          <h4 className={`font-semibold text-sm mb-1 ${isSender ? 'text-white' : 'text-gray-900'}`}>
            {preview.title}
          </h4>
          {preview.description && (
            <p className={`text-xs line-clamp-2 ${isSender ? 'text-blue-100' : 'text-gray-500'}`}>
              {preview.description}
            </p>
          )}
          <p className={`text-xs mt-1 truncate ${isSender ? 'text-blue-200' : 'text-gray-400'}`}>
            {preview.domain || new URL(url).hostname}
          </p>
        </div>
      </div>
    </a>
  );
};

export default LinkPreview;