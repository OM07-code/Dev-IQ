import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

export const AuthContext = createContext();

axios.defaults.baseURL = "http://localhost:3000";
axios.defaults.withCredentials = true;

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await axios.get("/api/auth/me");
      setUser(res.data);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoaded(true);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post("/api/auth/login", { email, password });
    setUser(res.data);
    return res.data;
  };

  const signup = async (name, email, password) => {
    const res = await axios.post("/api/auth/signup", { name, email, password });
    setUser(res.data);
    return res.data;
  };

  const logout = async () => {
    await axios.post("/api/auth/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoaded, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
