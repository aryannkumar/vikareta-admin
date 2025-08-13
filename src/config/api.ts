// API Configuration for Admin Panel
export const API_CONFIG = {
    // Primary API URL - use production API
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.vikareta.com',
    apiUrl: (process.env.NEXT_PUBLIC_API_URL || 'https://api.vikareta.com') + '/api',
    
    // Admin-specific endpoints
    adminEndpoint: '/admin',
    authEndpoint: '/auth',
    
    // Timeout settings
    timeout: 30000, // 30 seconds for admin operations
    retryAttempts: 3,
    
    // CORS settings
    withCredentials: true,
    
    // Headers
    defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
};

// Get the API base URL
export const getApiUrl = (): string => {
    return API_CONFIG.apiUrl;
};

// Get the base URL (without /api)
export const getBaseUrl = (): string => {
    return API_CONFIG.baseUrl;
};

export default API_CONFIG;