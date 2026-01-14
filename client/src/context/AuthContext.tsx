import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

interface AuthContextType {
    user: any;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (data: any) => Promise<void>;
    googleLogin: (idToken: string) => Promise<void>;
    logout: () => void;
    updateUser: (data: any) => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('vibbin_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('vibbin_user');
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, [token]);

    const login = async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        const { token, user } = res.data;
        localStorage.setItem('vibbin_token', token);
        localStorage.setItem('vibbin_user', JSON.stringify(user));
        setToken(token);
        setUser(user);
    };

    const signup = async (data: any) => {
        const res = await api.post('/auth/signup', data);
        const { token, user } = res.data;
        localStorage.setItem('vibbin_token', token);
        localStorage.setItem('vibbin_user', JSON.stringify(user));
        setToken(token);
        setUser(user);
    };

    const googleLogin = async (idToken: string) => {
        const res = await api.post('/auth/google', { idToken });
        const { token, user } = res.data;
        localStorage.setItem('vibbin_token', token);
        localStorage.setItem('vibbin_user', JSON.stringify(user));
        setToken(token);
        setUser(user);
    };

    const logout = () => {
        localStorage.removeItem('vibbin_token');
        localStorage.removeItem('vibbin_user');
        setToken(null);
        setUser(null);
    };

    const updateUser = (updatedUser: any) => {
        localStorage.setItem('vibbin_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, signup, googleLogin, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
