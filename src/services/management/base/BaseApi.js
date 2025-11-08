/**
 * BaseApi - Base class for all Management API modules
 * Provides standard CRUD operations with consistent error handling
 *
 * Usage:
 * class TrucksApi extends BaseApi {
 *   constructor(client) {
 *     super(client, '/trucks');
 *   }
 * }
 */

export default class BaseApi {
  constructor(client, basePath = '') {
    this.client = client; // axios instance
    this.basePath = basePath; // e.g., '/trucks', '/drivers'
  }

  /**
   * GET request - List or retrieve resource
   * @param {string} path - Additional path (optional, defaults to basePath)
   * @param {object} params - Query parameters
   */
  async get(path = '', params = {}) {
    try {
      const url = path ? `${this.basePath}${path}` : this.basePath;
      const response = await this.client.get(url, { params });
      return response.data || response;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * POST request - Create resource
   * @param {string} path - Additional path (optional)
   * @param {object} body - Request body
   */
  async post(path = '', body = {}) {
    try {
      const url = path ? `${this.basePath}${path}` : this.basePath;
      const response = await this.client.post(url, body);
      return response.data || response;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * PUT request - Update resource
   * @param {string} path - Resource path (e.g., '/123')
   * @param {object} body - Request body
   */
  async put(path, body = {}) {
    try {
      const url = `${this.basePath}${path}`;
      const response = await this.client.put(url, body);
      return response.data || response;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * PATCH request - Partial update resource
   * @param {string} path - Resource path (e.g., '/123')
   * @param {object} body - Request body
   */
  async patch(path, body = {}) {
    try {
      const url = `${this.basePath}${path}`;
      const response = await this.client.patch(url, body);
      return response.data || response;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * DELETE request - Delete resource
   * @param {string} path - Resource path (e.g., '/123')
   */
  async delete(path) {
    try {
      const url = `${this.basePath}${path}`;
      const response = await this.client.delete(url);
      return response.data || response;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * CRUD convenience methods
   */

  // List all resources with optional filters
  async list(params = {}) {
    return this.get('', params);
  }

  // Get single resource by ID
  async getById(id) {
    return this.get(`/${id}`);
  }

  // Create new resource
  async create(data) {
    return this.post('', data);
  }

  // Update resource by ID
  async update(id, data) {
    return this.put(`/${id}`, data);
  }

  // Partial update resource by ID
  async partialUpdate(id, data) {
    return this.patch(`/${id}`, data);
  }

  // Delete resource by ID
  async remove(id) {
    return this.delete(`/${id}`);
  }

  /**
   * Error handler - standardize error responses
   * @private
   */
  _handleError(error) {
    const errorResponse = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'An error occurred',
      data: error.response?.data,
      originalError: error,
    };

    console.error(`[${this.basePath}] API Error:`, errorResponse);
    return errorResponse;
  }
}
