// Backend API configuration
// Update this with your Render backend URL after deployment
export const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5001';

export const API_ENDPOINTS = {
  PREDICT: `${API_BASE_URL}/predict`,
  HEALTH: `${API_BASE_URL}/health`,
};
