// src/hooks/useAuth.js
// Temporary bypass for authentication - no loading state to prevent flickering
export const useAuth = () => {
  return {
    isAuthenticated: true,
    loading: false,
    user: { name: 'Mine Operator', role: 'Administrator' },
    login: () => Promise.resolve({ success: true }),
    logout: () => {}
  };
};