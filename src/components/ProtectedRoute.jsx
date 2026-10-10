import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    async function verifyAuth() {
      try {
        const res = await api.get('/api/admin/me');
        if (isMounted) {
          if (res?.success) {
            setAuthenticated(true);
          } else {
            setAuthenticated(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          setAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-3 border-[#FF5E00] border-t-transparent animate-spin" />
          <span className="text-xs font-semibold text-[#6B6B6B]">Verifying admin session...</span>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
