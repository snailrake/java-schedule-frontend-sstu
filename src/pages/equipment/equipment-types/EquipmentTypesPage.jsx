import React, { useState, useEffect, useMemo } from 'react'
import { authFetch } from '../../../apiClient.js'
import './EquipmentTypesPage.css'

export default function EquipmentTypesPage() {
    const [types, setTypes] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(0)
    const [size, setSize] = useState(10)
    const [totalPages, setTotalPages] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState({ name: '', active: true })

    const fetchTypes = () => {
        authFetch(`/api/v1/equipment-types?page=${page}&size=${size}`)
            .then(res => res.json())
            .then(dtoPage => {
                setTypes(dtoPage.content)
                setTotalPages(dtoPage.totalPages)
            })
    }

    useEffect(() => {
        fetchTypes()
    }, [page, size])

    const filteredList = useMemo(() => {
        if (!searchTerm.trim()) return types
        return types.filter(t =>
            t.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
        )
    }, [types, searchTerm])

    const openCreateModal = () => {
        setEditingId(null)
        setForm({ name: '', active: true })
        setIsModalOpen(true)
    }

    const openEditModal = t => {
        setEditingId(t.id)
        setForm({ name: t.name, active: t.active })
        setIsModalOpen(true)
    }

    const closeModal = () => setIsModalOpen(false)

    const handleDelete = () => {
        if (!editingId) return
        if (window.confirm('Удалить тип оборудования?')) {
            authFetch(`/api/v1/equipment-types/${editingId}`, { method: 'DELETE' })
                .then(fetchTypes)
                .then(closeModal)
        }
    }

    const handleSubmit = e => {
        e.preventDefault()
        const payload = { ...form }
        const method = editingId ? 'PUT' : 'POST'
        const url = editingId
            ? `/api/v1/equipment-types/${editingId}`
            : '/api/v1/equipment-types'
        authFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(fetchTypes)
            .then(closeModal)
    }

    return (
        // страница типов оборудования
        <div className="types-page">
            <div className="types-header">
                <h1>Типы оборудования</h1>
                <input
                    type="text"
                    placeholder="Поиск"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <button onClick={openCreateModal}>Добавить</button>
            </div>

            {/* таблица */}
            <div className="types-table-container">
                <table className="types-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Название</th>
                        <th>Активен</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredList.map(t => (
                        <tr key={t.id} onClick={() => openEditModal(t)} style={{ cursor: 'pointer' }}>
                            <td>{t.id}</td>
                            <td>{t.name}</td>
                            <td>{t.active ? 'Да' : 'Нет'}</td>
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
                        <div className="st-modal-header">
                            <h3 className="st-modal-title">
                                {editingId ? 'Редактировать тип оборудования' : 'Добавить тип оборудования'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <label>Название</label>
                            <input
                                type="text"
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
