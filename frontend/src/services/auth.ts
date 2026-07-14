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
  role: 'FREE' | 'PREMIUM' | 'LEARNER' | 'ADMIN';
  provider: 'google' | 'github' | 'local';
  providerName?: string;
  providerUserId?: string;
  phone?: string;
  country?: string;
  premiumActivatedAt?: string;
  premiumExpiresAt?: string;
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
  contactEmail: string;
  country: string;
  message?: string;
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
  private userKey = 'lescracks_user';

  // The JWT lives in an HttpOnly cookie issued by the backend. It is deliberately NOT
  // readable from JavaScript, so an XSS flaw anywhere in the app cannot steal it. The
  // browser attaches it to API calls automatically; we only cache the (non-secret)
  // user profile locally so the UI can render instantly on load.

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
  // The cookie is not visible to JS, so the server is the source of truth:
  // AuthContext confirms the session on load via getCurrentUser().
  isAuthenticated(): boolean {
    return !!this.getUser();
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
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const json = await response.json();

    // The backend set the auth cookie on this response — we only cache the profile.
    if (json.success && json.data) {
      const mappedUser = this.mapBackendUserToFrontend(json.data.user);
      this.setUser(mappedUser);
      return {
        success: true,
        user: mappedUser,
        message: json.message
      };
    }

    return {
      success: false,
      message: json.message || 'Email ou mot de passe incorrect.'
    };
  }

  async register(email: string, password: string, username?: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, username }),
    });

    const json = await response.json();

    // A successful registration returns no session: the account must be activated via
    // the email verification link first. Treat success-without-user as success so the
    // UI shows the "check your inbox" screen instead of an error.
    if (json.success) {
      if (json.data?.user) {
        // Immediate-login path (only if email verification is ever disabled)
        const mappedUser = this.mapBackendUserToFrontend(json.data.user);
        this.setUser(mappedUser);
        return { success: true, user: mappedUser, message: json.message };
      }
      return { success: true, message: json.message };
    }

    return {
      success: false,
      message: json.message || 'Inscription impossible. Merci de réessayer.'
    };
  }

  async logout(): Promise<void> {
    try {
      // The cookie rides along automatically; the backend revokes it and clears it.
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.warn('Logout API error (non-blocking):', error);
    } finally {
      this.removeUser();
    }
  }

  // === USER PROFILE ===
  async getCurrentUser(): Promise<User | null> {
    try {
      // Authenticated by the HttpOnly cookie. A 401 simply means no valid session.
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        credentials: 'include',
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
      premiumActivatedAt: backendUser.premiumActivatedAt,
      premiumExpiresAt: backendUser.premiumExpiresAt,
    };
  }

  // Map backend role name to frontend role
  private mapRole(roleName: string | undefined): 'FREE' | 'PREMIUM' | 'LEARNER' | 'ADMIN' {
    if (!roleName) return 'FREE';
    const upperRole = roleName.toUpperCase().replace('_', '');
    if (upperRole === 'ADMIN') return 'ADMIN';
    if (upperRole === 'PREMIUMUSER' || upperRole === 'PREMIUM') return 'PREMIUM';
    if (upperRole === 'LEARNER') return 'LEARNER';
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
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
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
      message: json.message || 'La mise à jour a échoué. Merci de réessayer.'
    };
  }

  // === CHANGE PASSWORD ===
  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/users/me/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
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
      message: json.message || 'Le changement de mot de passe a échoué.'
    };
  }

  // === DELETE ACCOUNT ===
  async deleteAccount(): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const json = await response.json();

    if (json.success) {
      this.removeUser();
      return { success: true, message: json.message || 'Compte supprimé avec succès.' };
    }

    return {
      success: false,
      message: json.message || 'La suppression du compte a échoué.'
    };
  }

  // === PREMIUM REQUEST ===
  async submitPremiumRequest(data: {
    whatsappNumber: string;
    contactEmail: string;
    country: string;
    message?: string;
  }): Promise<{ success: boolean; message?: string; data?: PremiumRequestResponse }> {
    const response = await fetch(`${API_BASE_URL}/premium/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const json = await response.json();
    if (json.success) {
      return { success: true, message: json.message, data: json.data };
    }
    return { success: false, message: json.message || 'La demande n\'a pas pu être envoyée. Merci de réessayer.' };
  }

  async getMyPremiumRequest(): Promise<{ success: boolean; data?: PremiumRequestResponse | null }> {
    const response = await fetch(`${API_BASE_URL}/premium/my-request`, {
      credentials: 'include',
    });

    const json = await response.json();
    if (json.success) {
      return { success: true, data: json.data };
    }
    return { success: false };
  }

  // === AVATAR UPLOAD ===
  async uploadAvatar(file: File): Promise<{ success: boolean; message?: string; user?: User }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const json = await response.json();
    if (json.success && json.data) {
      const user = this.mapBackendUserToFrontend(json.data);
      this.setUser(user);
      return { success: true, user, message: json.message };
    }
    return { success: false, message: json.message || 'L\'envoi du fichier a échoué. Merci de réessayer.' };
  }


  /**
   * Ask for the verification email again.
   *
   * The server answers the same way whether the address exists or not, so this can never
   * be used to discover who has an account here.
   */
  async resendVerification(email: string): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    const json = await response.json();
    return { success: !!json.success, message: json.message };
  }

  // === PASSWORD RESET ===
  async forgotPassword(email: string): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const json = await response.json();
    return { success: json.success, message: json.message };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    const json = await response.json();
    return { success: json.success, message: json.message };
  }

  // === CHECK OAUTH CALLBACK ===
  // After the OAuth redirect the backend has already set the auth cookie, so we just
  // ask the server who we are.
  async handleOAuthCallback(): Promise<AuthResponse> {
    const user = await this.getCurrentUser();
    if (user) {
      return { success: true, user };
    }
    
    return { success: false, message: 'Authentication failed' };
  }
}

export const authService = new AuthService();
export default authService;
