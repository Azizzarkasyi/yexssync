import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {APP_ENV} from "../config/env";

// Dynamic Base URL for API configured via .env
export const getApiBaseUrl = (): string => APP_ENV.getApiBaseUrl();

export const API_URL = getApiBaseUrl();

export const getUploadUrl = (filename?: string | null): string => {
  if (!filename) return "";
  if (filename.startsWith("http://") || filename.startsWith("https://")) {
    return filename;
  }
  const rootUrl = API_URL.replace(/\/api\/?$/, "");
  const cleanFilename = filename.startsWith("/") ? filename.slice(1) : filename;
  if (cleanFilename.startsWith("uploads/")) {
    return `${rootUrl}/${cleanFilename}`;
  }
  return `${rootUrl}/uploads/${cleanFilename}`;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token and Tenant ID
api.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      const tenantId = await AsyncStorage.getItem("tenant_id");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (tenantId) {
        config.headers["X-Tenant-ID"] = tenantId;
      }

      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  error => {
    return Promise.reject(error);
  },
);

export default api;
