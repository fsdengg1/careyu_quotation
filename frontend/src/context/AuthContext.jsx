import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../services/quotationApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("careyu_token");
    if (!token) {
      setReady(true);
      return;
    }
    authApi
      .me()
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem("careyu_token");
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  function login(token, nextUser) {
    localStorage.setItem("careyu_token", token);
    setUser(nextUser);
  }

  function logout() {
    localStorage.removeItem("careyu_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
