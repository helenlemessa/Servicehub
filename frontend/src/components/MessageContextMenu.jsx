import { useEffect, useRef } from 'react';
import { FaEdit, FaTrash, FaTrashAlt } from 'react-icons/fa';

const MessageContextMenu = ({ x, y, onClose, onEdit, onDeleteForMe, onDeleteForEveryone, isSender }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  // Adjust position if menu goes off screen
  const getAdjustedPosition = () => {
    if (!menuRef.current) return { top: y, left: x };
    
    const menuRect = menuRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let adjustedX = x;
    let adjustedY = y;
    
    // Adjust horizontal position
    if (x + menuRect.width > windowWidth) {
      adjustedX = windowWidth - menuRect.width - 10;
    }
    if (adjustedX < 10) adjustedX = 10;
    
    // Adjust vertical position (show below instead of above if needed)
    if (y - menuRect.height < 0) {
      adjustedY = y + 20;
    } else {
      adjustedY = y - menuRect.height - 10;
    }
    
    return { top: adjustedY, left: adjustedX };
  };

  const position = getAdjustedPosition();

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-xl border py-2 z-[100] min-w-[180px]"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {isSender && (
        <>
          <button
            onClick={() => {
              onEdit();
              onClose();
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm transition"
          >
            <FaEdit className="text-blue-500" size={14} />
            <span>Edit Message</span>
          </button>
          <div className="border-t my-1"></div>
          <button
            onClick={() => {
              onDeleteForEveryone();
              onClose();
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm text-red-600 transition"
          >
            <FaTrashAlt className="text-red-500" size={14} />
            <span>Delete for Everyone</span>
          </button>
        </>
      )}
      <button
        onClick={() => {
          onDeleteForMe();
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm transition"
      >
        <FaTrash className="text-gray-500" size={14} />
        <span>Delete for Me</span>
      </button>
    </div>
  );
};

export default MessageContextMenu;