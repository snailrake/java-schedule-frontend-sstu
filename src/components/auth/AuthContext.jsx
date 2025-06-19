import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const AuthContext = createContext(null);

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const navigate = useNavigate();
    const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken'));
    const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken'));
    const [username, setUsername] = useState(() => localStorage.getItem('username'));
    const [role, setRole] = useState(() => localStorage.getItem('role'));

    const login = async (usernameInput, password) => {
        try {
            const res = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: usernameInput, password })
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `Login failed: ${res.status}`);
            }
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await res.json();
            const payload = parseJwt(newAccessToken);
            const extractedRole = payload?.role || payload?.rol || '';

            setAccessToken(newAccessToken);
            setRefreshToken(newRefreshToken);
            setUsername(usernameInput);
            setRole(extractedRole);
            localStorage.setItem('accessToken', newAccessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            localStorage.setItem('username', usernameInput);
            localStorage.setItem('role', extractedRole);
            navigate('/');
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Ошибка входа',
                text: err.message,
                background: '#1f1f1f',
                color: '#ffffff',
                confirmButtonColor: '#4f46e5'
            });
        }
    };

    const logout = () => {
        setAccessToken(null);
        setRefreshToken(null);
        setUsername(null);
        setRole(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        navigate('/login');
    };

    useEffect(() => {
        if (!accessToken && window.location.pathname !== '/login') {
            navigate('/login');
        }
    }, [accessToken, navigate]);

    return (
        <AuthContext.Provider value={{ accessToken, refreshToken, username, role, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
