import React, { useState } from 'react'
import { useAuth } from '../../components/auth/AuthContext.jsx'

export default function LoginPage() {
    const { login } = useAuth()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!username || !password) {
            setError('Пожалуйста, заполните оба поля.')
            return
        }

        try {
            await login(username.trim(), password)
        } catch (err) {
            setError(err.message || 'Не удалось войти. Попробуйте ещё раз.')
        }
    }

    return (
        // форма авторизации
        <div
            style={{
                display: 'flex',
                minHeight: '100vh',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#111'
            }}
        >
            <form
                onSubmit={handleSubmit}
                style={{
                    background: '#1f1f1f',
                    padding: '32px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    color: '#fff',
                    width: '320px'
                }}
            >
                <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Войти</h2>

                {error && (
                    <div
                        style={{
                            marginBottom: '16px',
                            padding: '12px',
                            background: '#fde2e2',
                            color: '#b71c1c',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    >
                        {error}
                    </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                        Логин
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #333',
                            background: '#2a2a2a',
                            color: '#fff'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                        Пароль
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #333',
                            background: '#2a2a2a',
                            color: '#fff'
                        }}
                    />
                </div>

                <button
                    type="submit"
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '4px',
                        border: 'none',
                        background: '#4f46e5',
                        color: '#fff',
                        fontSize: '16px',
                        cursor: 'pointer'
                    }}
                >
                    Войти
                </button>
            </form>
        </div>
    )
}
