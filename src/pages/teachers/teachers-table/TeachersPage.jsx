import React, { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { authFetch } from '../../../apiClient.js'
import SubjectSelectModal from '../../../components/subject/SubjectSelectModal.jsx'
import './TeachersPage.css'

export default function TeachersPage() {
    const [teachers, setTeachers] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(0)
    const [size, setSize] = useState(10)
    const [totalPages, setTotalPages] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        hoursPerWeek: '',
        active: true,
        subjects: []
    })

    const fetchTeachers = () => {
        authFetch(`/api/v1/teachers?page=${page}&size=${size}`)
            .then(res => res.json())
            .then(dtoPage => {
                setTeachers(dtoPage.content)
                setTotalPages(dtoPage.totalPages)
            })
    }

    useEffect(fetchTeachers, [page, size])

    const filteredList = useMemo(() => {
        if (!searchTerm.trim()) return teachers
        return teachers.filter(t =>
            t.fullName.toLowerCase().includes(searchTerm.trim().toLowerCase())
        )
    }, [teachers, searchTerm])

    const openCreateModal = () => {
        setEditingId(null)
        setForm({
            fullName: '',
            email: '',
            phone: '',
            hoursPerWeek: '',
            active: true,
            subjects: []
        })
        setIsModalOpen(true)
    }

    const openEditModal = t => {
        setEditingId(t.id)
        setForm({
            fullName: t.fullName,
            email: t.email,
            phone: t.phone,
            hoursPerWeek: t.hoursPerWeek != null ? t.hoursPerWeek.toString() : '',
            active: t.active,
            subjects: t.subjects.map(s => s.id)
        })
        setIsModalOpen(true)
    }

    const closeModal = () => setIsModalOpen(false)
    const openSubjectModal = () => setIsSubjectModalOpen(true)
    const closeSubjectModal = () => setIsSubjectModalOpen(false)

    const handleDelete = () => {
        if (!editingId) return
        if (window.confirm('Удалить преподавателя?')) {
            authFetch(`/api/v1/teachers/${editingId}`, { method: 'DELETE' })
                .then(fetchTeachers)
                .then(closeModal)
        }
    }

    const handleSubmit = e => {
        e.preventDefault()
        const payload = {
            id: editingId,
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            hoursPerWeek: Number(form.hoursPerWeek),
            active: form.active,
            subjects: form.subjects.map(id => ({ id }))
        }
        const method = editingId ? 'PUT' : 'POST'
        const url = editingId ? `/api/v1/teachers/${editingId}` : '/api/v1/teachers'
        authFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(fetchTeachers)
            .then(closeModal)
    }

    return (
        <div className="teachers-page">
            <div className="teachers-header">
                <h1>Преподаватели</h1>
                <input
                    type="text"
                    placeholder="Поиск"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <button onClick={openCreateModal}>Добавить</button>
            </div>

            <div className="teachers-table-container">
                <table className="teachers-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>ФИО</th>
                        <th>Email</th>
                        <th>Телефон</th>
                        <th>Часов/нед</th>
                        <th>Активен</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredList.map(t => (
                        <tr key={t.id} onClick={() => openEditModal(t)} style={{ cursor: 'pointer' }}>
                            <td>{t.id}</td>
                            <td>{t.fullName}</td>
                            <td>{t.email}</td>
                            <td>{t.phone}</td>
                            <td>{t.hoursPerWeek}</td>
                            <td>{t.active ? 'Да' : 'Нет'}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="pagination">
                <button onClick={() => setPage(page - 1)} disabled={page === 0}>← Назад</button>
                <span>Страница {page + 1} из {totalPages}</span>
                <button onClick={() => setPage(page + 1)} disabled={page + 1 >= totalPages}>Вперед →</button>
            </div>

            {isModalOpen && (
                <div className="st-modal-overlay" onClick={closeModal}>
                    <div className="st-modal" onClick={e => e.stopPropagation()}>
                        <button className="st-modal-close-btn" onClick={closeModal}>
                            <X size={16} />
                        </button>
                        <div className="st-modal-header">
                            <h3 className="st-modal-title">
                                {editingId ? 'Редактировать преподавателя' : 'Добавить преподавателя'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                placeholder="ФИО"
                                value={form.fullName}
                                onChange={e => setForm({ ...form, fullName: e.target.value })}
                                className="st-input"
                                required
                                maxLength={100}
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                className="st-input"
                                pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                                maxLength={100}
                            />
                            <input
                                type="tel"
                                placeholder="Телефон"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                className="st-input"
                                pattern="^\+?\d{7,15}$"
                                maxLength={15}
                            />
                            <input
                                type="number"
                                placeholder="Часов/нед"
                                value={form.hoursPerWeek}
                                onChange={e => setForm({ ...form, hoursPerWeek: e.target.value })}
                                className="st-input"
                                min={0}
                                max={60}
                                step={1}
                            />

                            <div className="st-section-title">Предметы</div>
                            <ul className="st-list">
                                {form.subjects.map(id => {
                                    const subj = teachers
                                        .find(t => t.id === editingId)
                                        ?.subjects.find(s => s.id === id)
                                    return <li key={id}>{subj?.name}</li>
                                })}
                            </ul>
                            <button
                                type="button"
                                className="st-btn"
                                onClick={openSubjectModal}
                            >
                                Выбрать предметы
                            </button>

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
                                    <button
                                        type="button"
                                        className="st-btn st-btn-delete"
                                        onClick={handleDelete}
                                    >
                                        Удалить
                                    </button>
                                )}
                                <div style={{ flex: 1 }} />
                                <button
                                    type="button"
                                    className="st-btn"
                                    onClick={closeModal}
                                >
                                    Отмена
                                </button>
                                <button type="submit" className="st-btn">
                                    Сохранить
                                </button>
                            </div>
                        </form>

                        {isSubjectModalOpen && (
                            <SubjectSelectModal
                                selected={form.subjects}
                                onApply={sel => { setForm({ ...form, subjects: sel }); closeSubjectModal() }}
                                onCancel={closeSubjectModal}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
