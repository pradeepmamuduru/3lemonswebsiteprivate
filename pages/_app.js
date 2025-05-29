// pages/_app.js
import { createContext, useState, useEffect } from 'react';
import '../styles/globals.css'; // Import global styles

// Create an Auth Context
export const AuthContext = createContext();

function MyApp({ Component, pageProps }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Stores user data (name, phone, address, pincode)

  // Load user from localStorage on initial load
  useEffect(() => {
    try {
      // CHANGE HERE: Use 'loggedInUser' to match the key used in index.js
      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Failed to load user from localStorage:", error);
      // Clear potentially corrupted data
      // CHANGE HERE: Use 'loggedInUser' to match the key used in index.js
      localStorage.removeItem('loggedInUser');
    }
  }, []);

  // Save user to localStorage whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      // CHANGE HERE: Use 'loggedInUser' to match the key used in index.js
      localStorage.setItem('loggedInUser', JSON.stringify(currentUser));
    } else {
      // CHANGE HERE: Use 'loggedInUser' to match the key used in index.js
      localStorage.removeItem('loggedInUser');
    }
  }, [currentUser]);

  const login = (userData) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
  };

  const logout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    // localStorage.removeItem('loggedInUser'); // This is handled by useEffect above
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, currentUser, login, logout, setCurrentUser }}>
      <Component {...pageProps} />
    </AuthContext.Provider>
  );
}

export default MyApp;
