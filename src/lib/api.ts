// API client for Cloud Chaperone backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Authentication
  async register(email: string, password: string, fullName?: string) {
    const response = await this.request<{
      message: string;
      token: string;
      user: { id: string; email: string; fullName: string | null };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });

    this.setToken(response.token);
    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<{
      message: string;
      token: string;
      user: { id: string; email: string; fullName: string | null };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.setToken(response.token);
    return response;
  }

  async getCurrentUser() {
    return this.request<{
      user: {
        id: string;
        email: string;
        fullName: string | null;
        createdAt: string;
        roles: string[];
      };
    }>('/auth/me');
  }

  // Files
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/files/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  async getFiles() {
    return this.request<{
      files: Array<{
        id: string;
        name: string;
        size: number;
        mimeType: string;
        createdAt: string;
        owner: { email: string; fullName: string | null };
      }>;
    }>('/files');
  }

  async getFile(fileId: string) {
    return this.request<{
      file: {
        id: string;
        name: string;
        size: number;
        mimeType: string;
        createdAt: string;
        owner: { email: string; fullName: string | null };
      };
    }>(`/files/${fileId}`);
  }

  async downloadFile(fileId: string) {
    return this.request<{
      downloadUrl: string;
      fileName: string;
    }>(`/files/${fileId}/download`);
  }

  async deleteFile(fileId: string) {
    return this.request<{ message: string }>(`/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  async shareFile(fileId: string, isPublic: boolean = false, expiresAt?: string) {
    return this.request<{
      message: string;
      shareUrl: string;
      shareToken: string;
      isPublic: boolean;
      expiresAt: string | null;
    }>(`/files/${fileId}/share`, {
      method: 'POST',
      body: JSON.stringify({ isPublic, expiresAt }),
    });
  }

  async getSharedFile(token: string) {
    return this.request<{
      file: {
        id: string;
        name: string;
        size: number;
        mimeType: string;
        createdAt: string;
        owner: { email: string; fullName: string | null };
        isPublic: boolean;
        expiresAt: string | null;
      };
    }>(`/files/shared/${token}`);
  }

  // Users
  async updateProfile(fullName: string) {
    return this.request<{ message: string }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ fullName }),
    });
  }

  async getAccessRequests() {
    return this.request<{
      requests: Array<{
        id: string;
        fileId: string;
        fileName: string;
        status: string;
        requestedPermission: string;
        message: string | null;
        createdAt: string;
        respondedAt: string | null;
      }>;
    }>('/users/access-requests');
  }

  async createAccessRequest(fileId: string, permission: string = 'view', message?: string) {
    return this.request<{ message: string }>('/users/access-requests', {
      method: 'POST',
      body: JSON.stringify({ fileId, permission, message }),
    });
  }

  // Admin
  async getAdminFiles(search?: string, user?: string, type?: string, sortBy?: string, sortOrder?: string) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (user) params.append('user', user);
    if (type) params.append('type', type);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);

    return this.request<{
      files: Array<{
        id: string;
        name: string;
        size: number;
        mimeType: string;
        createdAt: string;
        userId: string;
        owner: { email: string; fullName: string | null };
      }>;
    }>(`/admin/files?${params.toString()}`);
  }

  async getAdminStats() {
    return this.request<{
      totalFiles: number;
      totalUsers: number;
      totalStorage: number;
      pendingRequests: number;
      filesByType: Record<string, number>;
    }>('/admin/stats');
  }

  async getAdminUsers() {
    return this.request<{
      users: Array<{
        id: string;
        email: string;
        fullName: string | null;
        createdAt: string;
        roles: string[];
      }>;
    }>('/admin/users');
  }

  async getAdminAccessRequests() {
    return this.request<{
      requests: Array<{
        id: string;
        fileId: string;
        fileName: string;
        requestedBy: { id: string; email: string; fullName: string | null };
        owner: { id: string; email: string; fullName: string | null };
        status: string;
        requestedPermission: string;
        message: string | null;
        createdAt: string;
        respondedAt: string | null;
      }>;
    }>('/admin/access-requests');
  }

  async approveAccessRequest(requestId: string, permission: string = 'view') {
    return this.request<{ message: string }>(`/admin/access-requests/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ permission }),
    });
  }

  async denyAccessRequest(requestId: string) {
    return this.request<{ message: string }>(`/admin/access-requests/${requestId}/deny`, {
      method: 'POST',
    });
  }

  async updateUserRole(userId: string, role: string) {
    return this.request<{ message: string }>(`/admin/users/${userId}/role`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
