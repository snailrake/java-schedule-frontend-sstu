import React, { useState, useEffect, useMemo } from 'react'
import { authFetch } from '../../../apiClient.js'
import './CabinetsTypes.css'

export default function CabinetsTypes() {
    const [types, setTypes] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState({ name: '', active: true })
    const [page, setPage] = useState(0)
    const [size, setSize] = useState(10)
    const [totalPages, setTotalPages] = useState(0)

    const loadTypes = () => {
        authFetch(`/api/v1/cabinet-types?page=${page}&size=${size}`)
            .then(res => res.json())
            .then(dtoPage => {
                setTypes(dtoPage.content)
                setTotalPages(dtoPage.totalPages)
            })
    }

    useEffect(() => {
        loadTypes()
    }, [page, size])

    const filteredList = useMemo(() => {
        if (!searchTerm.trim()) return types
        return types.filter(t =>
            t.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [types, searchTerm])

    const openCreateModal = () => {
        setEditingId(null)
        setForm({ name: '', active: true })
        setIsModalOpen(true)
    }

    const openEditModal = type => {
        setEditingId(type.id)
        setForm({ name: type.name, active: type.active })
        setIsModalOpen(true)
    }

    const closeModal = () => setIsModalOpen(false)

    const handleDelete = () => {
        if (!editingId) return
        if (window.confirm('Удалить этот тип кабинетов?')) {
            authFetch(`/api/v1/cabinet-types/${editingId}`, { method: 'DELETE' })
                .then(() => {
                    loadTypes()
                    closeModal()
                })
        }
    }

    const handleSubmit = e => {
        e.preventDefault()
        const payload = { name: form.name, active: form.active }
        const method = editingId ? 'PUT' : 'POST'
        const url = editingId
            ? `/api/v1/cabinet-types/${editingId}`
            : '/api/v1/cabinet-types'
        authFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(() => loadTypes())
            .then(closeModal)
    }

    return (
        // страница
        <div className="types-page">
            <div className="types-header">
                <h1>Типы кабинетов</h1>
                <input
                    type="text"
                    placeholder="Поиск"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <button onClick={openCreateModal}>Добавить</button>
            </div>

            {/* таблица */}
            <table className="types-table">
                <thead>
                <tr>
                    <th>Название</th>
                    <th>Активен</th>
                </tr>
                </thead>
                <tbody>
                {filteredList.map(type => (
                    <tr key={type.id} onClick={() => openEditModal(type)}>
                        <td>{type.name}</td>
                        <td>{type.active ? 'Да' : 'Нет'}</td>
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
                                {editingId ? 'Редактировать тип кабинетов' : 'Добавить тип кабинетов'}
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
                                    <button type="button" className="st-btn st-btn-delete" onClick={handleDelete}>Удалить</button>
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
