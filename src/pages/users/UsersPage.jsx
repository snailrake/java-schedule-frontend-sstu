import React, { useState, useEffect, useMemo } from 'react'
import { Trash2, X } from 'lucide-react'
import { authFetch } from '../../apiClient.js'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import './UsersPage.css'

export default function UsersPage() {
    const [users, setUsers] = useState([])
    const [roles, setRoles] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(0)
    const [size, setSize] = useState(10)
    const [totalPages, setTotalPages] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formUsername, setFormUsername] = useState('')
    const [formPassword, setFormPassword] = useState('')
    const [formRole, setFormRole] = useState('')

    const roleLabels = {
        ROLE_USER: 'Пользователь системы',
        ROLE_SCHEDULER: 'Диспетчер расписания',
        ROLE_FACILITY_MANAGER: 'Заведующий хозяйством',
        ROLE_ADMIN: 'Администратор системы',
    }

    const loadUsers = () => {
        authFetch(`/api/v1/users?page=${page}&size=${size}`)
            .then(res => res.json())
            .then(dtoPage => {
                setUsers(dtoPage.content)
                setTotalPages(dtoPage.totalPages)
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Ошибка загрузки',
                    text: err.message,
                    background: '#1f1f1f',
                    color: '#ffffff',
                    confirmButtonColor: '#4f46e5'
                })
            })
    }

    const loadRoles = () => {
        authFetch('/api/v1/roles')
            .then(res => res.json())
            .then(data => {
                setRoles(data)
                if (data.length > 0) setFormRole(data[0].name)
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Ошибка загрузки ролей',
                    text: err.message,
                    background: '#1f1f1f',
                    color: '#ffffff',
                    confirmButtonColor: '#4f46e5'
                })
            })
    }

    useEffect(() => { loadUsers() }, [page, size])
    useEffect(() => { loadRoles() }, [])

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return users
        return users.filter(u =>
            u.username.toLowerCase().includes(searchTerm.trim().toLowerCase())
        )
    }, [users, searchTerm])

    const openCreateModal = () => {
        setFormUsername('')
        setFormPassword('')
        setFormRole(roles.length > 0 ? roles[0].name : '')
        setIsModalOpen(true)
    }
    const closeModal = () => setIsModalOpen(false)

    const handleDelete = id => {
        Swal.fire({
            title: 'Вы уверены?',
            text: 'Это действие безвозвратно удалит пользователя.',
            icon: 'warning',
            showCancelButton: true,
            background: '#1f1f1f',
            color: '#ffffff',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Да, удалить',
            cancelButtonText: 'Отмена'
        }).then(res => {
            if (res.isConfirmed) {
                authFetch(`/api/v1/users/${id}`, { method: 'DELETE' })
                    .then(() => {
                        loadUsers()
                        Swal.fire({
                            icon: 'success',
                            title: 'Удалено',
                            text: 'Пользователь был успешно удалён.',
                            background: '#1f1f1f',
                            color: '#ffffff',
                            confirmButtonColor: '#4f46e5'
                        })
                    })
                    .catch(err => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Ошибка удаления',
                            text: err.message,
                            background: '#1f1f1f',
                            color: '#ffffff',
                            confirmButtonColor: '#4f46e5'
                        })
                    })
            }
        })
    }

    const handleSubmit = e => {
        e.preventDefault()
        if (!formUsername.trim() || !formPassword || !formRole) {
            Swal.fire({
                icon: 'error',
                title: 'Ошибка валидации',
                text: 'Заполните все поля.',
                background: '#1f1f1f',
                color: '#ffffff',
                confirmButtonColor: '#4f46e5'
            })
            return
        }
        const payload = {
            username: formUsername.trim(),
            password: formPassword,
            roleName: formRole
        }
        authFetch('/api/v1/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => {
                if (!res.ok) throw new Error(`Ошибка ${res.status}`)
                return res.json()
            })
            .then(() => {
                loadUsers()
                setIsModalOpen(false)
                Swal.fire({
                    icon: 'success',
                    title: 'Добавлено',
                    text: 'Новый пользователь успешно сохранён.',
                    background: '#1f1f1f',
                    color: '#ffffff',
                    confirmButtonColor: '#4f46e5'
                })
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Ошибка создания',
                    text: err.message,
                    background: '#1f1f1f',
                    color: '#ffffff',
                    confirmButtonColor: '#4f46e5'
                })
            })
    }

    return (
        <div className="users-page">
            <div className="users-header">
                <h1>Управление пользователями</h1>
                <input
                    type="text"
                    placeholder="Поиск"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <button onClick={openCreateModal}>Добавить пользователя</button>
            </div>

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Имя пользователя</th>
                        <th>Роль</th>
                        <th>Действия</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredUsers.length === 0 ? (
                        <tr>
                            <td colSpan={4}>Нет пользователей</td>
                        </tr>
                    ) : (
                        filteredUsers.map(u => (
                            <tr key={u.id}>
                                <td>{u.id}</td>
                                <td>{u.username}</td>
                                <td>{roleLabels[u.role] || u.role}</td>
                                <td>
                                    <button onClick={() => handleDelete(u.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            <div className="pagination">
                <button onClick={() => setPage(page - 1)} disabled={page === 0}>
                    ← Назад
                </button>
                <span>Страница {page + 1} из {totalPages}</span>
                <button onClick={() => setPage(page + 1)} disabled={page + 1 >= totalPages}>
                    Вперед →
                </button>
            </div>

            {isModalOpen && (
                <div className="st-modal-overlay" onClick={closeModal}>
                    <div className="st-modal" onClick={e => e.stopPropagation()}>
                        <button className="st-modal-close-btn" onClick={closeModal}>
                            <X size={16} />
                        </button>
                        <form onSubmit={handleSubmit}>
                            <label className="st-modal-label">Имя пользователя</label>
                            <input
                                className="st-input"
                                type="text"
                                value={formUsername}
                                onChange={e => setFormUsername(e.target.value)}
                            />

                            <label className="st-modal-label">Пароль</label>
                            <input
                                className="st-input"
                                type="password"
                                value={formPassword}
                                onChange={e => setFormPassword(e.target.value)}
                            />

                            <label className="st-modal-label">Роль</label>
                            <select
                                className="st-select"
                                value={formRole}
                                onChange={e => setFormRole(e.target.value)}
                            >
                                {roles.map(r => (
                                    <option key={r.id} value={r.name}>
                                        {roleLabels[r.name] || r.name}
                                    </option>
                                ))}
                            </select>

                            <div className="st-modal-footer">
                                <button type="button" className="st-btn" onClick={closeModal}>
                                    Отмена
                                </button>
                                <button type="submit" className="st-btn">
                                    Сохранить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
