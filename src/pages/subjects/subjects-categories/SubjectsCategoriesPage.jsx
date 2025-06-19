import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { authFetch } from '../../../apiClient.js';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import './SubjectsCategoriesPage.css';

export default function SubjectsCategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: '', active: true });

    const fetchCategories = () => {
        authFetch(`/api/v1/subject-categories?page=${page}&size=${size}`)
            .then(res => res.json())
            .then(dtoPage => {
                setCategories(dtoPage.content);
                setTotalPages(dtoPage.totalPages);
            })
            .catch(err => Swal.fire('Ошибка', err.message, 'error'));
    };

    useEffect(() => {
        fetchCategories();
    }, [page, size]);

    const filtered = useMemo(() => {
        if (!searchTerm.trim()) return categories;
        return categories.filter(c =>
            c.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
        );
    }, [categories, searchTerm]);

    const openCreate = () => {
        setEditingId(null);
        setForm({ name: '', active: true });
        setIsModalOpen(true);
    };

    const openEdit = c => {
        setEditingId(c.id);
        setForm({ name: c.name, active: c.active });
        setIsModalOpen(true);
    };

    const close = () => setIsModalOpen(false);

    const handleDelete = () => {
        if (!editingId) return;
        Swal.fire({
            title: 'Удалить категорию?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Да',
            cancelButtonText: 'Нет'
        }).then(result => {
            if (result.isConfirmed) {
                authFetch(`/api/v1/subject-categories/${editingId}`, { method: 'DELETE' })
                    .then(() => {
                        fetchCategories();
                        close();
                    })
                    .catch(err => Swal.fire('Ошибка', err.message, 'error'));
            }
        });
    };

    const handleSubmit = e => {
        e.preventDefault();
        const payload = { name: form.name.trim(), active: form.active };
        if (!payload.name) {
            Swal.fire('Ошибка', 'Название обязательно', 'error');
            return;
        }
        const url = editingId
            ? `/api/v1/subject-categories/${editingId}`
            : '/api/v1/subject-categories';
        const method = editingId ? 'PUT' : 'POST';
        authFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(() => {
                fetchCategories();
                close();
            })
            .catch(err => Swal.fire('Ошибка', err.message, 'error'));
    };

    return (
        <div className="categories-page">

            {/* заголовок и поиск */}
            <div className="categories-header">
                <h1>Категории</h1>
                <input type="text" placeholder="Поиск" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <button onClick={openCreate}>Добавить</button>
            </div>

            {/* таблица категорий */}
            <table className="categories-table">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Активна</th>
                </tr>
                </thead>
                <tbody>
                {filtered.map(c => (
                    <tr key={c.id} onClick={() => openEdit(c)} style={{ cursor: 'pointer' }}>
                        <td>{c.id}</td>
                        <td>{c.name}</td>
                        <td>{c.active ? 'Да' : 'Нет'}</td>
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
                <>
                    {/* модалка */}
                    <div className="st-modal-overlay" onClick={close}>
                        <div className="st-modal" onClick={e => e.stopPropagation()}>
                            <div className="st-modal-header">
                                <h3 className="st-modal-title">
                                    {editingId ? 'Редактировать категорию' : 'Добавить категорию'}
                                </h3>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <label>Название</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="st-input"
                                />
                                <label className="st-checkbox-row">
                                    <input
                                        type="checkbox"
                                        checked={form.active}
                                        onChange={e => setForm({ ...form, active: e.target.checked })}
                                    /> Активна
                                </label>
                                <div className="st-modal-footer">
                                    {editingId && <button type="button" className="st-btn st-btn-delete" onClick={handleDelete}>Удалить</button>}
                                    <button type="button" className="st-btn" onClick={close}>Отмена</button>
                                    <button type="submit" className="st-btn">Сохранить</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
