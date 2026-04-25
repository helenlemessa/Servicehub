// frontend/src/utils/linkUtils.js
export const extractUrls = (text) => {
  if (!text) return [];
  
  // Regular expression to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  
  if (!matches) return [];
  
  // Remove duplicates
  return [...new Set(matches)];
};

export const hasUrls = (text) => {
  return extractUrls(text).length > 0;
};