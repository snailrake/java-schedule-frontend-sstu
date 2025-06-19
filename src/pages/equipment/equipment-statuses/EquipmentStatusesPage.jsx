import React, { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { authFetch } from '../../../apiClient.js'
import './EquipmentStatusesPage.css'

export default function EquipmentStatusesPage() {
    const [statuses, setStatuses] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(0)
    const [size, setSize] = useState(10)
    const [totalPages, setTotalPages] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState({ name: '', active: true })

    const fetchStatuses = () => {
        authFetch(`/api/v1/equipment-statuses?page=${page}&size=${size}`)
            .then(res => res.json())
            .then(dtoPage => {
                setStatuses(dtoPage.content)
                setTotalPages(dtoPage.totalPages)
            })
    }

    useEffect(() => {
        fetchStatuses()
    }, [page, size])

    const filteredList = useMemo(() => {
        if (!searchTerm.trim()) return statuses
        return statuses.filter(s =>
            s.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
        )
    }, [statuses, searchTerm])

    const openCreateModal = () => {
        setEditingId(null)
        setForm({ name: '', active: true })
        setIsModalOpen(true)
    }

    const openEditModal = s => {
        setEditingId(s.id)
        setForm({ name: s.name, active: s.active })
        setIsModalOpen(true)
    }

    const closeModal = () => setIsModalOpen(false)

    const handleDelete = () => {
        if (!editingId) return
        if (window.confirm('Удалить статус оборудования?')) {
            authFetch(`/api/v1/equipment-statuses/${editingId}`, { method: 'DELETE' })
                .then(fetchStatuses)
                .then(closeModal)
        }
    }

    const handleSubmit = e => {
        e.preventDefault()
        const payload = { ...form }
        const method = editingId ? 'PUT' : 'POST'
        const url = editingId
            ? `/api/v1/equipment-statuses/${editingId}`
            : '/api/v1/equipment-statuses'
        authFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(fetchStatuses)
            .then(closeModal)
    }

    return (
        // страница
        <div className="statuses-page">
            <div className="statuses-header">
                <h1>Статусы оборудования</h1>
                <input
                    type="text"
                    placeholder="Поиск"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <button onClick={openCreateModal}>Добавить</button>
            </div>

            {/* таблица */}
            <div className="statuses-table-container">
                <table className="statuses-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Название</th>
                        <th>Активен</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredList.map(s => (
                        <tr key={s.id} onClick={() => openEditModal(s)} style={{ cursor: 'pointer' }}>
                            <td>{s.id}</td>
                            <td>{s.name}</td>
                            <td>{s.active ? 'Да' : 'Нет'}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* пагинация */}
            <div className="pagination">
                <button onClick={() => setPage(page - 1)} disabled={page === 0}>← Назад</button>
                <span>Страница {page + 1} из {totalPages}</span>
                <button onClick={() => setPage(page + 1)} disabled={page + 1 >= totalPages}>Вперед →</button>
            </div>

            {/* модалка */}
            {isModalOpen && (
                <div className="st-modal-overlay" onClick={closeModal}>
                    <div className="st-modal" onClick={e => e.stopPropagation()}>
                        <button className="st-modal-close-btn" onClick={closeModal}><X size={16} /></button>
                        <div className="st-modal-header">
                            <h3 className="st-modal-title">
                                {editingId ? 'Редактировать статус оборудования' : 'Добавить статус оборудования'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                placeholder="Название"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="st-input"
                                required
                            />
                            <div className="st-checkbox-row">
                                <input
                                    type="checkbox"
                                    checked={form.active}
                                    onChange={e => setForm({ ...form, active: e.target.checked })}
                                />
                                <span>Активен</span>
                            </div>
                            <div className="st-modal-footer">
                                {editingId && (
                                    <button type="button" className="st-btn st-btn-delete" onClick={handleDelete}>Удалить</button>
                                )}
                                <div style={{ flex: 1 }} />
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
