import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const ReportModal = ({ isOpen, onClose, postId }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');

  const reasons = [
    'Spam or misleading',
    'Harassment or hate speech',
    'Inappropriate content',
    'Intellectual property violation',
    'Something else'
  ];

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`/services/${postId}/report`, { reason: selectedReason });
      toast.success('Post reported successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to report post');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Report Post</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">
          Why are you reporting this post?
        </p>
        
        <div className="space-y-2 mb-4">
          {reasons.map((r) => (
            <label key={r} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <input
                type="radio"
                name="reason"
                value={r}
                checked={selectedReason === r}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="text-blue-500"
              />
              <span>{r}</span>
            </label>
          ))}
        </div>
        
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Additional details (optional)"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          rows="3"
        />
        
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? 'Reporting...' : 'Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;