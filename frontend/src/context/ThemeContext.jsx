// frontend/src/context/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        setTheme('dark');
        document.documentElement.classList.add('dark');
      } else {
        setTheme('light');
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // In ThemeContext.jsx, update the toggleTheme function
const toggleTheme = () => {
  if (theme === 'light') {
    setTheme('dark');
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark'); // Also add to body
    localStorage.setItem('theme', 'dark');
  } else {
    setTheme('light');
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark'); // Also remove from body
    localStorage.setItem('theme', 'light');
  }
};

// Also update the useEffect
useEffect(() => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    setTheme('dark');
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  } else if (savedTheme === 'light') {
    setTheme('light');
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }
}, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};