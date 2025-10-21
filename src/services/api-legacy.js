// src/services/api.js
// ⚠️ DEPRECATED: This file is kept for backward compatibility only
// Please use individual imports from '@/services/api' instead
// 
// Old way: import { authAPI } from './services/api.js'
// New way: import { authAPI } from './services/api'

/**
 * This file re-exports all API modules from the new modular structure
 * for backward compatibility with existing code.
 * 
 * Gradually migrate to the new import structure:
 * import { authAPI, trucksAPI } from './services/api'
 */

// Re-export everything from the new API structure
export * from './api/index.js';

// For default imports
import apiModule from './api/index.js';
export default apiModule;
