import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Palette } from 'lucide-react';
import { authFetch } from '../../../apiClient.js';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { ChromePicker } from 'react-color';
import './EventTypesPage.css';

export default function EventTypesPage() {
    const [eventTypes, setEventTypes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formName, setFormName] = useState('');
    const [formColor, setFormColor] = useState('#000000');
    const [formActive, setFormActive] = useState(true);
    const [formRequiresSubject, setFormRequiresSubject] = useState(true);

    const [showColorPicker, setShowColorPicker] = useState(false);
    const colorPickerRef = useRef(null);

    const fetchEventTypes = () => {
        authFetch(`/api/v1/event-types?page=${page}&size=${size}`)
            .then(r => r.json())
            .then(dto => {
                setEventTypes(dto.content);
                setTotalPages(dto.totalPages);
            })
            .catch(e => Swal.fire('Ошибка', e.message, 'error'));
    };

    useEffect(fetchEventTypes, [page, size]);

    useEffect(() => {
        const handleOutside = e => {
            if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
                setShowColorPicker(false);
            }
        };

        if (showColorPicker) {
            document.addEventListener('mousedown', handleOutside);
        } else {
            document.removeEventListener('mousedown', handleOutside);
        }

        return () => document.removeEventListener('mousedown', handleOutside);
    }, [showColorPicker]);

    const filteredList = useMemo(() => {
        if (!searchTerm.trim()) return eventTypes;
        return eventTypes.filter(et =>
            et.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
        );
    }, [eventTypes, searchTerm]);

    const openCreate = () => {
        setEditingId(null);
        setFormName('');
        setFormColor('#000000');
        setFormActive(true);
        setFormRequiresSubject(true);
        setShowColorPicker(false);
        setIsModalOpen(true);
    };

    const openEdit = et => {
        setEditingId(et.id);
        setFormName(et.name);
        setFormColor(et.color || '#000000');
        setFormActive(!!et.active);
        setFormRequiresSubject(!!et.requiresSubject);
        setShowColorPicker(false);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setShowColorPicker(false);
    };

    const handleDelete = () => {
        if (!editingId) return;

        Swal.fire({
            title: 'Удалить этот тип события?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Да',
            cancelButtonText: 'Нет'
        }).then(res => {
            if (res.isConfirmed) {
                authFetch(`/api/v1/event-types/${editingId}`, { method: 'DELETE' })
                    .then(() => {
                        fetchEventTypes();
                        closeModal();
                    })
                    .catch(e => Swal.fire('Ошибка', e.message, 'error'));
            }
        });
    };

    const handleSubmit = e => {
        e.preventDefault();

        const payload = {
            name: formName.trim(),
            color: formColor,
            active: formActive,
            requiresSubject: formRequiresSubject
        };

        if (!payload.name) {
            Swal.fire('Ошибка', 'Название обязательно', 'error');
            return;
        }

        const isNew = editingId == null;
        const url = isNew ? '/api/v1/event-types' : `/api/v1/event-types/${editingId}`;
        const method = isNew ? 'POST' : 'PUT';
        const body = JSON.stringify(isNew ? payload : { ...payload, id: editingId });

        authFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body
        })
            .then(r => r.json())
            .then(() => {
                fetchEventTypes();
                closeModal();
            })
            .catch(e => Swal.fire('Ошибка', e.message, 'error'));
    };

    return (
        <div className="event-types-page">
            <div className="event-types-header">
                <h1>Типы событий</h1>
                <input type="text" placeholder="Поиск" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <button onClick={openCreate}>Добавить</button>
            </div>

            <table>
                <thead>
                <tr>
                    <th>Название</th>
                    <th>Цвет</th>
                    <th>Активен</th>
                    <th>Предмет</th>
                </tr>
                </thead>
                <tbody>
                {filteredList.map(et => (
                    <tr key={et.id} onClick={() => openEdit(et)} style={{ cursor: 'pointer' }}>
                        <td>{et.name}</td>
                        <td>
                            <span>{et.color}</span>
                            <div className="color-box" style={{ backgroundColor: et.color }} />
                        </td>
                        <td>{et.active ? 'Да' : 'Нет'}</td>
                        <td>{et.requiresSubject ? 'Да' : 'Нет'}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            <div className="pagination">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0}>← Назад</button>
                <span>Страница {page + 1} из {totalPages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page + 1 >= totalPages}>Вперед →</button>
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={closeModal}><X size={16} /></button>
                        <h3 style={{ textAlign: 'center', marginBottom: 16 }}>
                            {editingId == null ? 'Добавить тип события' : 'Редактировать тип события'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <label>Название</label>
                            <input type="text" className="modal-input" value={formName} onChange={e => setFormName(e.target.value)} />

                            <label>Цвет</label>
                            <div style={{ position: 'relative', marginBottom: 10 }}>
                                <div className="color-input">
                                    <input type="text" className="modal-input" style={{ flex: 1 }} value={formColor} onChange={e => setFormColor(e.target.value)} />
                                    <button type="button" className="modal-btn" onClick={() => setShowColorPicker(v => !v)}><Palette size={16} /></button>
                                </div>
                                {showColorPicker && (
                                    <div ref={colorPickerRef} className="color-picker-inline">
                                        <ChromePicker color={formColor} onChange={c => setFormColor(c.hex)} disableAlpha />
                                    </div>
                                )}
                            </div>

                            <label className="checkbox-row">
                                <input type="checkbox" checked={formActive} onChange={e => setFormActive(e.target.checked)} /> Активен
                            </label>

                            <label className="checkbox-row">
                                <input type="checkbox" checked={formRequiresSubject} onChange={e => setFormRequiresSubject(e.target.checked)} /> Требует предмет
                            </label>

                            <div className="modal-actions">
                                {editingId != null && <button type="button" className="modal-btn delete" onClick={handleDelete}>Удалить</button>}
                                <div style={{ flex: 1 }} />
                                <button type="button" className="modal-btn" onClick={closeModal}>Отмена</button>
                                <button type="submit" className="modal-btn">Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
