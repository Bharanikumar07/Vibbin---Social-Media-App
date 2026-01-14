import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/api';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [theme, setTheme] = useState<Theme>(() => {
        // 1. Check local storage
        const saved = localStorage.getItem('theme') as Theme;
        if (saved) return saved;
        // 2. Default
        return 'light';
    });

    useEffect(() => {
        // Sync with user preference from DB on login
        if (user && user.theme && (user.theme === 'light' || user.theme === 'dark')) {
            setTheme(user.theme as Theme);
        }
    }, [user]);

    useEffect(() => {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => {
            const newTheme = prev === 'light' ? 'dark' : 'light';
            // Sync with DB if logged in
            if (user) {
                api.put('/auth/profile', { theme: newTheme }).catch(console.error);
            }
            return newTheme;
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
