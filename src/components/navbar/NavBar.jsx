import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    Calendar,
    BookOpen,
    Building,
    GraduationCap,
    User,
    Menu,
    X,
    LogOut,
    Users as UsersIcon
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext.jsx'

export default function NavBar() {
    const [open, setOpen] = useState(false)
    const { pathname } = useLocation()
    const { username, role, logout } = useAuth()

    const translateRole = (r) => {
        switch (r) {
            case 'ROLE_USER':
                return 'Пользователь системы'
            case 'ROLE_SCHEDULER':
                return 'Диспетчер расписания'
            case 'ROLE_FACILITY_MANAGER':
                return 'Заведующий хозяйством'
            case 'ROLE_ADMIN':
                return 'Администратор системы'
            default:
                return r
        }
    }

    const allLinks = [
        {
            to: '/',
            label: 'Расписание',
            icon: <Calendar className="w-5 h-5 mr-1 inline-block" />,
            roles: ['ROLE_USER', 'ROLE_SCHEDULER', 'ROLE_ADMIN']
        },
        {
            to: '/subjects',
            label: 'Предметы',
            icon: <BookOpen className="w-5 h-5 mr-1 inline-block" />,
            roles: ['ROLE_SCHEDULER', 'ROLE_ADMIN']
        },
        {
            to: '/cabinets',
            label: 'Кабинеты',
            icon: <Building className="w-5 h-5 mr-1 inline-block" />,
            roles: ['ROLE_FACILITY_MANAGER', 'ROLE_ADMIN']
        },
        {
            to: '/teachers',
            label: 'Учителя',
            icon: <GraduationCap className="w-5 h-5 mr-1 inline-block" />,
            roles: ['ROLE_SCHEDULER', 'ROLE_ADMIN']
        },
        {
            to: '/users',
            label: 'Пользователи',
            icon: <UsersIcon className="w-5 h-5 mr-1 inline-block" />,
            roles: ['ROLE_ADMIN']
        }
    ]

    const links = allLinks.filter(link => link.roles.includes(role))

    return (
        // шапка
        <header className="fixed top-0 left-0 right-0 bg-[#1e1e1e] text-white z-50">
            <div className="relative h-16">
                <Link
                    to="/"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center text-2xl font-bold"
                    onClick={() => setOpen(false)}
                >
                    <Calendar className="w-6 h-6 mr-2" />
                    Школьное расписание
                </Link>

                {/* навигация по центру */}
                <nav className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden md:flex space-x-8">
                    {links.map(({ to, label, icon }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`relative px-2 py-1 font-medium flex items-center ${
                                pathname === to ? 'text-indigo-300' : 'text-white'
                            }`}
                        >
                            {icon}
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* справа профиль и меню */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-4">
                    {username ? (
                        <>
                            <div className="hidden md:flex flex-col items-end text-sm font-medium">
                                <div className="flex items-center cursor-pointer">
                                    <User className="w-5 h-5 mr-1" />
                                    {username}
                                </div>
                                <div className="text-xs text-gray-400">{translateRole(role)}</div>
                            </div>
                            <button onClick={logout} className="hidden md:flex items-center text-sm font-medium">
                                <LogOut className="w-5 h-5 mr-1" /> Выйти
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="hidden md:flex items-center text-sm font-medium">Войти</Link>
                    )}
                    <button onClick={() => setOpen(o => !o)} className="md:hidden p-2 rounded" aria-label="Toggle menu">
                        {open ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* мобильное меню */}
            {open && (
                <div className="md:hidden bg-[#1e1e1e]">
                    <nav className="flex flex-col space-y-2 px-4 py-3">
                        {links.map(({ to, label }) => (
                            <Link
                                key={to}
                                to={to}
                                onClick={() => setOpen(false)}
                                className={`block w-full text-center py-2 rounded ${
                                    pathname === to
                                        ? 'bg-indigo-800 text-indigo-200'
                                        : 'text-white'
                                }`}
                            >
                                {label}
                            </Link>
                        ))}

                        {/* блок профиля в мобилке */}
                        <div className="mt-3 pt-3 text-center text-sm">
                            {username ? (
                                <div className="flex flex-col items-center space-y-1">
                                    <div className="flex items-center text-gray-200">
                                        <User className="w-5 h-5 mr-1" />
                                        {username}
                                    </div>
                                    <div className="text-xs text-gray-400">{translateRole(role)}</div>
                                    <button
                                        onClick={() => { setOpen(false); logout() }}
                                        className="flex items-center justify-center w-full py-2"
                                    >
                                        <LogOut className="w-5 h-5 mr-1" /> Выйти
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={() => setOpen(false)}
                                    className="block w-full text-center py-2"
                                >
                                    Войти
                                </Link>
                            )}
                        </div>
                    </nav>
                </div>
            )}
        </header>
    )
}
