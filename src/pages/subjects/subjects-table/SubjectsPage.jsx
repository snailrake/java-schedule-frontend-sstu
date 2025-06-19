import React, { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { authFetch } from '../../../apiClient.js'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import './SubjectsPage.css'

export default function SubjectsPage() {
    const [categories, setCategories] = useState([])
    const [subjects, setSubjects] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(0)
    const [size, setSize] = useState(10)
    const [totalPages, setTotalPages] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState({
        code: '',
        name: '',
        categoryId: '',
        hoursPerWeek: '',
        active: true
    })

    const fetchCategories = () => {
        authFetch('/api/v1/subject-categories/list?active=true')
            .then(res => res.json())
            .then(setCategories)
            .catch(err => Swal.fire('Ошибка', 'Ошибка загрузки категорий: ' + err.message, 'error'))
    }

    const fetchSubjects = () => {
        authFetch(`/api/v1/subjects?page=${page}&size=${size}`)
            .then(res => res.json())
            .then(dtoPage => {
                setSubjects(dtoPage.content)
                setTotalPages(dtoPage.totalPages)
            })
            .catch(err => Swal.fire('Ошибка', 'Ошибка загрузки предметов: ' + err.message, 'error'))
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        fetchSubjects()
    }, [page, size])

    const filteredList = useMemo(() => {
        if (!searchTerm.trim()) return subjects
        return subjects.filter(s =>
            s.name.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
            s.code.toLowerCase().includes(searchTerm.trim().toLowerCase())
        )
    }, [subjects, searchTerm])

    const openCreateModal = () => {
        setEditingId(null)
        setForm({ code: '', name: '', categoryId: '', hoursPerWeek: '', active: true })
        setIsModalOpen(true)
    }

    const openEditModal = subject => {
        setEditingId(subject.id)
        setForm({
            code: subject.code || '',
            name: subject.name || '',
            categoryId: subject.categoryId || '',
            hoursPerWeek: subject.hoursPerWeek || '',
            active: subject.active ?? true
        })
        setIsModalOpen(true)
    }

    const closeModal = () => setIsModalOpen(false)

    const handleDelete = () => {
        if (!editingId) return
        Swal.fire({
            title: 'Удалить этот предмет?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Да',
            cancelButtonText: 'Нет'
        }).then(result => {
            if (result.isConfirmed) {
                authFetch(`/api/v1/subjects/${editingId}`, { method: 'DELETE' })
                    .then(() => {
                        fetchSubjects()
                        closeModal()
                    })
                    .catch(err => Swal.fire('Ошибка', 'Ошибка удаления: ' + err.message, 'error'))
            }
        })
    }

    const handleSubmit = e => {
        e.preventDefault()
        const payload = {
            code: form.code,
            name: form.name,
            categoryId: Number(form.categoryId),
            hoursPerWeek: Number(form.hoursPerWeek),
            active: form.active
        }
        if (!payload.code || !payload.name || !payload.categoryId) {
            Swal.fire('Ошибка', 'Заполните все обязательные поля', 'error')
            return
        }
        if (isNaN(payload.hoursPerWeek) || payload.hoursPerWeek < 1 || payload.hoursPerWeek > 40) {
            Swal.fire('Ошибка', 'Часов в неделю должно быть от 1 до 40', 'error')
            return
        }
        const url = editingId ? `/api/v1/subjects/${editingId}` : '/api/v1/subjects'
        const method = editingId ? 'PUT' : 'POST'
        authFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(() => {
                fetchSubjects()
                closeModal()
            })
            .catch(err => Swal.fire('Ошибка', 'Ошибка сохранения: ' + err.message, 'error'))
    }

    return (
        <div className="subjects-page">

            {/* заголовок и поиск */}
            <div className="subjects-header">
                <h1>Предметы</h1>
                <input type="text" placeholder="Поиск" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <button onClick={openCreateModal}>Добавить</button>
            </div>

            {/* таблица предметов */}
            <table className="subjects-table">
                <thead>
                <tr>
                    <th>Код</th>
                    <th>Название</th>
                    <th>Категория</th>
                    <th>Часов/нед</th>
                    <th>Активен</th>
                </tr>
                </thead>
                <tbody>
                {filteredList.map(subject => (
                    <tr key={subject.id} onClick={() => openEditModal(subject)} style={{ cursor: 'pointer' }}>
                        <td>{subject.code}</td>
                        <td>{subject.name}</td>
                        <td>{subject.category}</td>
                        <td>{subject.hoursPerWeek}</td>
                        <td>{subject.active ? 'Да' : 'Нет'}</td>
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

            {isModalOpen && (
                /* модалка */
                <div className="st-modal-overlay" onClick={closeModal}>
                    <div className="st-modal" onClick={e => e.stopPropagation()}>
                        <div className="st-modal-header">
                            <h3 className="st-modal-title">{editingId ? 'Редактировать предмет' : 'Добавить предмет'}</h3>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <label>Код</label>
                            <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="st-input" />

                            <label>Название</label>
                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="st-input" />

                            <label>Категория</label>
                            <select value={String(form.categoryId)} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="st-select">
                                <option value="">-- выберите категорию --</option>
                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>

                            <label>Часов в неделю</label>
                            <input type="number" min="1" max="40" value={form.hoursPerWeek} onChange={e => setForm({ ...form, hoursPerWeek: e.target.value })} className="st-input" />

                            <label className="st-checkbox-row"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Активен</label>

                            <div className="st-modal-footer">
                                {editingId && <button type="button" className="st-btn st-btn-delete" onClick={handleDelete}>Удалить</button>}
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
