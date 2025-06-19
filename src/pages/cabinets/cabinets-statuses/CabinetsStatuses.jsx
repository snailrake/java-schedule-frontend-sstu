import React, { useState, useEffect, useMemo } from 'react'
import { authFetch } from '../../../apiClient.js'
import './CabinetsStatuses.css'

export default function CabinetsStatuses() {
    const [statuses, setStatuses] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState({ name: '', active: true })
    const [page, setPage] = useState(0)
    const [size, setSize] = useState(10)
    const [totalPages, setTotalPages] = useState(0)

    const loadStatuses = () => {
        authFetch(`/api/v1/cabinet-status?page=${page}&size=${size}`)
            .then(res => res.json())
            .then(dtoPage => {
                setStatuses(dtoPage.content)
                setTotalPages(dtoPage.totalPages)
            })
    }

    useEffect(() => {
        loadStatuses()
    }, [page, size])

    const filteredList = useMemo(() => {
        if (!searchTerm.trim()) return statuses
        return statuses.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [statuses, searchTerm])

    const openCreateModal = () => {
        setEditingId(null)
        setForm({ name: '', active: true })
        setIsModalOpen(true)
    }

    const openEditModal = status => {
        setEditingId(status.id)
        setForm({ name: status.name, active: status.active })
        setIsModalOpen(true)
    }

    const closeModal = () => setIsModalOpen(false)

    const handleDelete = () => {
        if (!editingId) return
        if (window.confirm('Удалить статус кабинета?')) {
            authFetch(`/api/v1/cabinet-status/${editingId}`, { method: 'DELETE' })
                .then(() => {
                    loadStatuses()
                    closeModal()
                })
        }
    }

    const handleSubmit = e => {
        e.preventDefault()
        const payload = { name: form.name, active: form.active }
        const method = editingId ? 'PUT' : 'POST'
        const url = editingId
            ? `/api/v1/cabinet-status/${editingId}`
            : '/api/v1/cabinet-status'
        authFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(() => loadStatuses())
            .then(closeModal)
    }

    return (
        // страница
        <div className="statuses-page">
            <div className="statuses-header">
                <h1>Статусы кабинетов</h1>
                <input
                    type="text"
                    placeholder="Поиск"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <button onClick={openCreateModal}>Добавить</button>
            </div>

            <table className="statuses-table">
                <thead>
                <tr>
                    <th>Название</th>
                    <th>Активен</th>
                </tr>
                </thead>
                <tbody>
                {filteredList.map(s => (
                    <tr key={s.id} onClick={() => openEditModal(s)}>
                        <td>{s.name}</td>
                        <td>{s.active ? 'Да' : 'Нет'}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* пагинация */}
            <div className="pagination">
                <button onClick={() => setPage(page - 1)} disabled={page === 0}>← Назад</button>
                <span>Страница {page + 1} из {totalPages}</span>
                <button onClick={() => setPage(page + 1)} disabled={page + 1 >= totalPages}>Вперед →</button>
            </div>

            {/* модалка */}
            {isModalOpen && (
                <div className="st-modal-overlay">
                    <div className="st-modal">
                        <div className="st-modal-header">
                            <h3 className="st-modal-title">
                                {editingId ? 'Редактировать статус' : 'Добавить статус'}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                placeholder="Название"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="st-input"
                            />
                            <label className="st-checkbox-row">
                                <input
                                    type="checkbox"
                                    checked={form.active}
                                    onChange={e => setForm({ ...form, active: e.target.checked })}
                                />
                                Активен
                            </label>

                            <div className="st-modal-footer">
                                {editingId && (
                                    <button
                                        type="button"
                                        className="st-btn st-btn-delete"
                                        onClick={handleDelete}
                                    >
                                        Удалить
                                    </button>
                                )}
                                <button type="button" className="st-btn" onClick={closeModal}>Отмена</button>
                                <button type="submit" className="st-btn">Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
