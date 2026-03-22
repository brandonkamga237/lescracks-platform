// src/services/auth.ts
import { ENV } from '@/config/env';

const API_BASE_URL = ENV.API_BASE_URL;

// Types
export interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  picture?: string;
  role: 'FREE' | 'PREMIUM' | 'ADMIN';
  provider: 'google' | 'github' | 'local';
  providerName?: string;
  providerUserId?: string;
  phone?: string;
  country?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}

export interface PremiumRequestResponse {
  id: number;
  userId: number;
  username: string;
  email: string;
  whatsappNumber: string;
  country: string;
  message?: string;
  status: 'PENDING' | 'CONTACTED' | 'PAID' | 'REJECTED';
  createdAt: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  phone?: string;
  country?: string;
}

class AuthService {
  private tokenKey = 'lescracks_auth_token';
  private userKey = 'lescracks_user';

  // === TOKEN MANAGEMENT ===
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  // === USER MANAGEMENT ===
  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  removeUser(): void {
    localStorage.removeItem(this.userKey);
  }

  // === AUTH STATE ===
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  }

  // === OAUTH REDIRECT ===
  // Note: OAuth endpoints are at root level, not under /api
  loginWithGoogle(): void {
    window.location.href = `/oauth2/authorization/google`;
  }

  loginWithGitHub(): void {
    window.location.href = `/oauth2/authorization/github`;
  }

  // === EMAIL/PASSWORD AUTH ===
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const json = await response.json();
    
    // Handle backend response format: { success: true, data: { accessToken, tokenType, user } }
    if (json.success && json.data) {
      const authData = json.data;
      const token = authData.accessToken || authData.token;
      if (token) {
        this.setToken(token);
        // Map backend user to frontend format
        const mappedUser = this.mapBackendUserToFrontend(authData.user);
        this.setUser(mappedUser);
      }
      return {
        success: true,
        token,
        user: this.mapBackendUserToFrontend(authData.user),
        message: json.message
      };
    }

    return {
      success: false,
      message: json.message || 'Login failed'
    };
  }

  async register(email: string, password: string, username?: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, username }),
    });

    const json = await response.json();
    
    // Handle backend response format: { success: true, data: { accessToken, tokenType, user } }
    if (json.success && json.data) {
      const authData = json.data;
      const token = authData.accessToken || authData.token;
      if (token) {
        this.setToken(token);
        // Map backend user to frontend format
        const mappedUser = this.mapBackendUserToFrontend(authData.user);
        this.setUser(mappedUser);
      }
      return {
        success: true,
        token,
        user: this.mapBackendUserToFrontend(authData.user),
        message: json.message
      };
    }

    return {
      success: false,
      message: json.message || 'Registration failed'
    };
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
    } catch (error) {
      console.warn('Logout API error (non-blocking):', error);
    } finally {
      this.removeToken();
      this.removeUser();
    }
  }

  // === USER PROFILE ===
  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const json = await response.json();
      
      // Handle backend response format: { success: true, data: { ... } }
      if (json.success && json.data) {
        const userData = this.mapBackendUserToFrontend(json.data);
        this.setUser(userData);
        return userData;
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
    }

    return null;
  }

  // Map backend user response to frontend user format
  mapBackendUserToFrontend(backendUser: any): User {
    return {
      id: String(backendUser.id || ''),
      email: backendUser.email || '',
      username: backendUser.username,
      firstName: backendUser.firstName,
      lastName: backendUser.lastName,
      name: backendUser.name || backendUser.username,
      picture: backendUser.picture,
      role: this.mapRole(backendUser.roleName),
      provider: this.mapProvider(backendUser.providerName),
      providerName: backendUser.providerName,
      providerUserId: backendUser.providerUserId,
      phone: backendUser.phone,
      country: backendUser.country,
    };
  }

  // Map backend role name to frontend role
  private mapRole(roleName: string | undefined): 'FREE' | 'PREMIUM' | 'ADMIN' {
    if (!roleName) return 'FREE';
    const upperRole = roleName.toUpperCase();
    if (upperRole === 'ADMIN') return 'ADMIN';
    if (upperRole === 'PREMIUM' || upperRole === 'PREMIUM_USER') return 'PREMIUM';
    return 'FREE';
  }

  // Map backend provider name to frontend provider
  private mapProvider(providerName: string | undefined): 'google' | 'github' | 'local' {
    if (!providerName) return 'local';
    const upperProvider = providerName.toUpperCase();
    if (upperProvider === 'GOOGLE') return 'google';
    if (upperProvider === 'GITHUB') return 'github';
    return 'local';
  }

  // === UPDATE PROFILE ===
  async updateProfile(data: UpdateProfileRequest): Promise<AuthResponse> {
    const token = this.getToken();
    if (!token) {
      return { success: false, message: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const json = await response.json();

    // Handle backend response format: { success: true, data: { ... } }
    if (json.success && json.data) {
      this.setUser(json.data);
      return {
        success: true,
        user: json.data,
        message: json.message
      };
    }

    return {
      success: false,
      message: json.message || 'Update failed'
    };
  }

  // === CHANGE PASSWORD ===
  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    const token = this.getToken();
    if (!token) {
      return { success: false, message: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/users/me/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const json = await response.json();
    
    // Handle backend response format
    if (json.success) {
      return {
        success: true,
        message: json.message
      };
    }

    return {
      success: false,
      message: json.message || 'Password change failed'
    };
  }

  // === DELETE ACCOUNT ===
  async deleteAccount(): Promise<AuthResponse> {
    const token = this.getToken();
    if (!token) {
      return { success: false, message: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const json = await response.json();
    
    if (json.success) {
      this.removeToken();
      this.removeUser();
      return { success: true, message: json.message || 'Account deleted successfully' };
    }

    return {
      success: false,
      message: json.message || 'Account deletion failed'
    };
  }

  // === UPGRADE TO PREMIUM ===
  async upgradeToPremium(): Promise<AuthResponse> {
    const token = this.getToken();
    if (!token) {
      return { success: false, message: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/users/upgrade-premium`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const json = await response.json();

    // Handle backend response format: { success: true, data: { ... } }
    if (json.success && json.data) {
      this.setUser(json.data);
      return {
        success: true,
        user: json.data,
        message: json.message
      };
    }

    return {
      success: false,
      message: json.message || 'Upgrade failed'
    };
  }

  // === PREMIUM REQUEST ===
  async submitPremiumRequest(data: {
    whatsappNumber: string;
    country: string;
    message?: string;
  }): Promise<{ success: boolean; message?: string; data?: PremiumRequestResponse }> {
    const token = this.getToken();
    if (!token) return { success: false, message: 'Non authentifié' };

    const response = await fetch(`${API_BASE_URL}/premium/request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const json = await response.json();
    if (json.success) {
      return { success: true, message: json.message, data: json.data };
    }
    return { success: false, message: json.message || 'Erreur lors de la soumission' };
  }

  async getMyPremiumRequest(): Promise<{ success: boolean; data?: PremiumRequestResponse | null }> {
    const token = this.getToken();
    if (!token) return { success: false };

    const response = await fetch(`${API_BASE_URL}/premium/my-request`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const json = await response.json();
    if (json.success) {
      return { success: true, data: json.data };
    }
    return { success: false };
  }

  // === CHECK OAUTH CALLBACK ===
  async handleOAuthCallback(): Promise<AuthResponse> {
    const token = this.getToken();
    if (token) {
      const user = await this.getCurrentUser();
      if (user) {
        return { success: true, user };
      }
    }
    
    return { success: false, message: 'Authentication failed' };
  }
}

export const authService = new AuthService();
export default authService;
