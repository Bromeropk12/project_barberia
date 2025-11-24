// useTabNavigation.ts - Hook personalizado para navegación por tabs
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function useTabNavigation<T extends string>(
    defaultTab: T,
    tabToPath: (tab: T) => string,
    pathToTab: (path: string) => T,
    basePath?: string
) {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<T>(defaultTab);

    // Sincronizar tab con la URL
    useEffect(() => {
        const path = location.pathname;
        const currentTab = pathToTab(path);

        if (currentTab !== activeTab) {
            setActiveTab(currentTab);
        }

        // Redirigir a tab por defecto si estamos en la ruta base
        if (basePath && (path === basePath || path === `${basePath}/`)) {
            navigate(tabToPath(defaultTab), { replace: true });
        }
    }, [location.pathname, activeTab, pathToTab, navigate, tabToPath, defaultTab, basePath]);

    const handleTabChange = (tab: T) => {
        setActiveTab(tab);
        navigate(tabToPath(tab));
    };

    return {
        activeTab,
        handleTabChange
    };
}