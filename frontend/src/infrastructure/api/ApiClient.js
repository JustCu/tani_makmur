// ============================================================
// ApiClient — HTTP client for Google Apps Script Web App
// Implements Repository pattern (Infrastructure layer)
// ============================================================

import { API_BASE_URL } from '../../shared/constants';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Makes a GET request to the Apps Script Web App.
   * @param {string} action - The action parameter
   * @param {Object} params - Additional query parameters
   * @returns {Promise<Object>}
   */
  async get(action, params = {}) {
    const url = new URL(this.baseUrl);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Request failed');
      }
      return data.data;
    } catch (error) {
      console.error(`API GET ${action} failed:`, error);
      throw error;
    }
  }

  /**
   * Makes a POST request to the Apps Script Web App.
   * @param {string} action - The action to perform
   * @param {Object} data - The request body data
   * @returns {Promise<Object>}
   */
  async post(action, data = {}) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, data }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Request failed');
      }
      return result.data;
    } catch (error) {
      console.error(`API POST ${action} failed:`, error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default ApiClient;
