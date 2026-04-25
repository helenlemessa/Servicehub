import React from 'react';
import { Link } from 'react-router-dom';

export const parseMentions = (text) => {
  if (!text) return text;
  
  // This regex matches @username with spaces - looks for @ followed by any characters until a space or end
  // We need to match names that might have spaces like "helen lemessa"
  const mentionRegex = /@([\w\s]+?)(?=\s|$)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    const username = match[1].trim();
    parts.push(
      <Link
        key={match.index}
        to={`/profile?name=${encodeURIComponent(username)}`}
        className="text-blue-500 hover:text-blue-700 font-medium hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        @{username}
      </Link>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
};