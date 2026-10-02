import React, { useContext, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const { user, isLoading } = useContext(AuthContext);
  const pathname = usePathname();
  const router = useRouter();

  // Public routes allowed without authentication
  const isPublicRoute = (path: string) => {
    return path === '/' || path === '/auth/login' || path === '/privacy-policy';
  };

  useEffect(() => {
    if (isLoading) return;

    const isPublic = isPublicRoute(pathname);

    // Case 1: Unauthenticated visitor trying to access protected routes
    if (!user) {
      if (!isPublic) {
        console.warn(`[RouteGuard] Unauthorized access to ${pathname}, redirecting to login...`);
        router.replace('/');
      }
      return;
    }

    // Case 2: Authenticated user accessing public login route -> redirect to their dashboard
    if (pathname === '/' || pathname === '/auth/login') {
      if (user.role === 'SUPER_ADMIN') {
        router.replace('/superadmin');
      } else if (user.role === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/user');
      }
      return;
    }

    // Case 3: Role-based access control (RBAC)
    // /superadmin routes -> Only SUPER_ADMIN
    if (pathname.startsWith('/superadmin')) {
      if (user.role !== 'SUPER_ADMIN') {
        console.warn(`[RouteGuard] Forbidden access to superadmin by role: ${user.role}`);
        if (user.role === 'ADMIN') {
          router.replace('/admin');
        } else {
          router.replace('/user');
        }
      }
      return;
    }

    // /admin routes -> Only ADMIN or SUPER_ADMIN
    if (pathname.startsWith('/admin')) {
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        console.warn(`[RouteGuard] Forbidden access to admin by role: ${user.role}`);
        router.replace('/user');
      }
      return;
    }
  }, [user, isLoading, pathname]);

  const isPublic = isPublicRoute(pathname);

  // While checking token on protected page, show loading overlay so protected layout doesn't flash
  if (isLoading && !isPublic) {
    return (
      <View style={{ flex: 1, backgroundColor: '#08142c', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2a75d3" />
      </View>
    );
  }

  // Block rendering protected page if user is not logged in
  if (!isLoading && !user && !isPublic) {
    return (
      <View style={{ flex: 1, backgroundColor: '#08142c', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2a75d3" />
      </View>
    );
  }

  // Block rendering if regular USER attempts to view /admin or /superadmin
  if (!isLoading && user && user.role === 'USER' && (pathname.startsWith('/admin') || pathname.startsWith('/superadmin'))) {
    return (
      <View style={{ flex: 1, backgroundColor: '#08142c', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2a75d3" />
      </View>
    );
  }

  // Block rendering if ADMIN attempts to view /superadmin
  if (!isLoading && user && user.role === 'ADMIN' && pathname.startsWith('/superadmin')) {
    return (
      <View style={{ flex: 1, backgroundColor: '#08142c', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2a75d3" />
      </View>
    );
  }

  return <>{children}</>;
};

export default RouteGuard;
