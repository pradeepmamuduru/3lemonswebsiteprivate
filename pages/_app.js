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
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Failed to load user from localStorage:", error);
      // Clear potentially corrupted data
      localStorage.removeItem('currentUser');
    }
  }, []);

  // Save user to localStorage whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  const login = (userData) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
  };

  const logout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    // localStorage.removeItem('currentUser'); // This is handled by useEffect above
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, currentUser, login, logout, setCurrentUser }}>
      <Component {...pageProps} />
    </AuthContext.Provider>
  );
}

export default MyApp;
