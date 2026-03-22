// src/pages/OAuthCallback.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@/services/auth';
import { Loader2 } from 'lucide-react';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const token = searchParams.get('token');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(decodeURIComponent(errorParam));
        return;
      }

      if (!token) {
        setError('No token received');
        return;
      }

      try {
        // Store the token
        authService.setToken(token);

        // Fetch the current user
        const user = await authService.getCurrentUser();
        
        if (user) {
          // Redirect to profile
          navigate('/profil', { replace: true });
        } else {
          setError('Failed to fetch user information');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('Authentication failed');
      }
    };

    handleOAuthCallback();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Authentication Error</h1>
          <p className="text-white/60 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="text-gold hover:text-gold-light"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-4" />
        <p className="text-white/60">Completing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
