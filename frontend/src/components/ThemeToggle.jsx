// frontend/src/components/ThemeToggle.jsx
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    console.log('Toggle clicked, current theme:', theme);
    toggleTheme();
  };

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <FaMoon className="text-gray-700 dark:text-gray-300 text-xl" />
      ) : (
        <FaSun className="text-yellow-400 text-xl" />
      )}
    </button>
  );
};

export default ThemeToggle;