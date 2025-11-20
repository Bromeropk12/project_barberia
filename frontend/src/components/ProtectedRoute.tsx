// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { User } from './types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    currentUser: User | null;
    requiredRole?: 'cliente' | 'barbero' | 'super_admin';
}

export function ProtectedRoute({ children, currentUser, requiredRole }: ProtectedRouteProps) {
    // Si no hay usuario, redirigir a inicio
    if (!currentUser) {
        return <Navigate to="/inicio" replace />;
    }

    // Si se requiere un rol específico, verificar
    if (requiredRole && currentUser.rol !== requiredRole) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
