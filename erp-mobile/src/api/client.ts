import axios from 'axios';
import { getItemAsync } from '../utils/storage';
import { Platform } from 'react-native';

// We are using your computer's local network IP so both the 
// computer browser and your mobile phone can connect to the backend!
const API_URL = 'http://192.168.29.184:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await getItemAsync('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error fetching token from storage', error);
  }
  return config;
});

export default apiClient;
