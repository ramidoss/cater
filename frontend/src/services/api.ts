import axios from 'axios';
import { DesignFeedback } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const designAnalysisAPI = {
  analyzeDesign: async (file: File): Promise<DesignFeedback> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/analyze-design', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};