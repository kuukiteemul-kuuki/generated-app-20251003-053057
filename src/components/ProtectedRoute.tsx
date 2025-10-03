import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth-store';
import { AppLayout } from './AppLayout';
interface ProtectedRouteProps {
  roles: string[];
}
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const role = useAuthStore((s) => s.role);
  if (!role || !roles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return <AppLayout />;
}