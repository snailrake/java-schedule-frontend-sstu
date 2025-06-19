import React, { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { authFetch } from '../../../apiClient.js'
import EquipmentSelectModal from '../../../components/equipment/EquipmentSelectModal.jsx'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import './CabinetsPage.css'

export default function CabinetsPage() {
    const [types, setTypes] = useState([])
    const [statuses, setStatuses] = useState([])
    const [rooms, setRooms] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEquipModalOpen, setIsEquipModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [initialEquipments, setInitialEquipments] = useState([])
    const [form, setForm] = useState({
        number: '',
        typeId: '',
        floor: '',
        capacity: '',
        statusId: '',
        active: true,
        equipments: []
    })
    const [page, setPage] = useState(0)
    const [size, setSize] = useState(10)
    const [totalPages, setTotalPages] = useState(0)

    const fetchRooms = () => {
        authFetch(`/api/v1/cabinets?page=${page}&size=${size}`)
            .then(res => res.json())
            .then(dtoPage => {
                setRooms(dtoPage.content)
                setTotalPages(dtoPage.totalPages)
            })
    }

    useEffect(() => {
        authFetch('/api/v1/cabinet-types/list')
            .then(res => res.json())
            .then(setTypes)
    }, [])

    useEffect(() => {
        authFetch('/api/v1/cabinet-status/list')
            .then(res => res.json())
            .then(setStatuses)
    }, [])

    useEffect(() => {
        fetchRooms()
    }, [page, size])

    const filteredList = useMemo(() => {
        if (!searchTerm.trim()) return rooms
        return rooms.filter(r =>
            r.number.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [rooms, searchTerm])

    const openCreateModal = () => {
        setEditingId(null)
        setInitialEquipments([])
        setForm({
            number: '',
            typeId: '',
            floor: '',
            capacity: '',
            statusId: '',
            active: true,
            equipments: []
        })
        setIsModalOpen(true)
    }

    const openEditModal = room => {
        setEditingId(room.id)
        setInitialEquipments(
            room.equipments.map(e => ({
                equipmentId: e.equipmentId,
                quantity: e.quantity
            }))
        )
        setForm({
            number: room.number,
            typeId: room.typeId,
            floor: room.floor,
            capacity: room.capacity,
            statusId: room.statusId,
            active: room.active,
            equipments: room.equipments.map(e => ({
                equipmentId: e.equipmentId,
                equipmentName: e.equipmentName,
                quantity: e.quantity
            }))
        })
        setIsModalOpen(true)
    }

    const closeModal = () => setIsModalOpen(false)
    const openEquipModal = () => setIsEquipModalOpen(true)
    const closeEquipModal = () => setIsEquipModalOpen(false)

    const handleDelete = () => {
        if (!editingId) return
        if (window.confirm('Удалить этот кабинет?')) {
            authFetch(`/api/v1/cabinets/${editingId}`, { method: 'DELETE' })
                .then(() => {
                    setRooms(prev => prev.filter(r => r.id !== editingId))
                    closeModal()
                })
        }
    }

    const handleSubmit = e => {
        e.preventDefault()

        if (!form.number.trim() || !form.typeId || !form.floor || !form.capacity || !form.statusId) {
            Swal.fire('Ошибка', 'Заполните все обязательные поля', 'error')
            return
        }

        const floorNum = Number(form.floor)
        if (isNaN(floorNum) || floorNum < 1 || floorNum > 5) {
            Swal.fire('Ошибка', 'Этаж должен быть от 1 до 5', 'error')
            return
        }

        const capNum = Number(form.capacity)
        if (isNaN(capNum) || capNum < 1 || capNum > 100) {
            Swal.fire('Ошибка', 'Вместимость должна быть от 1 до 100', 'error')
            return
        }

        const deltaMap = new Map()
        form.equipments.forEach(e => {
            const prev = initialEquipments.find(pe => pe.equipmentId === e.equipmentId)
            const diff = e.quantity - (prev?.quantity || 0)
            if (diff !== 0) deltaMap.set(e.equipmentId, diff)
        })
        initialEquipments.forEach(pe => {
            if (!form.equipments.find(e => e.equipmentId === pe.equipmentId)) {
                deltaMap.set(pe.equipmentId, -pe.quantity)
            }
        })

        const payload = {
            number: form.number.trim(),
            typeId: Number(form.typeId),
            floor: floorNum,
            capacity: capNum,
            statusId: Number(form.statusId),
            active: form.active,
            equipments: Array.from(deltaMap.entries()).map(([equipmentId, quantity]) => ({
                equipmentId,
                quantity
            }))
        }

        const method = editingId ? 'PUT' : 'POST'
        const url = editingId
            ? `/api/v1/cabinets/${editingId}`
            : '/api/v1/cabinets'

        authFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(data => {
                if (editingId) {
                    setRooms(prev => prev.map(r => (r.id === editingId ? data : r)))
                } else {
                    setRooms(prev => [...prev, data])
                }
                closeModal()
            })
    }

    const onEquipApply = selected => {
        setForm({ ...form, equipments: selected })
        closeEquipModal()
    }

    return (
        // страница
        <div className="rooms-page">
            <div className="rooms-header">
                <h1>Кабинеты</h1>
                <input
                    type="text"
                    placeholder="Поиск"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <button onClick={openCreateModal}>Добавить</button>
            </div>

            {/* таблица кабинетов */}
            <table className="rooms-table">
                <thead>
                <tr>
                    <th>Номер</th>
                    <th>Тип</th>
                    <th>Этаж</th>
                    <th>Вместимость</th>
                    <th>Статус</th>
                    <th>Активен</th>
                </tr>
                </thead>
                <tbody>
                {filteredList.map(room => (
                    <tr key={room.id} onClick={() => openEditModal(room)}>
                        <td>{room.number}</td>
                        <td>{room.typeName}</td>
                        <td>{room.floor}</td>
                        <td>{room.capacity}</td>
                        <td>{room.statusName}</td>
                        <td>{room.active ? 'Да' : 'Нет'}</td>
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
                <div className="st-modal-overlay" onClick={closeModal}>
                    <div className="st-modal" onClick={e => e.stopPropagation()}>
                        <div className="st-modal-header">
                            <h3 className="st-modal-title">{editingId ? 'Редактировать кабинет' : 'Добавить кабинет'}</h3>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <label>Номер</label>
                            <input type="text" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} className="st-input" />

                            <label>Тип кабинета</label>
                            <select value={String(form.typeId)} onChange={e => setForm({ ...form, typeId: e.target.value })} className="st-select">
                                <option value="">-- выберите тип --</option>
                                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>

                            <label>Этаж</label>
                            <select value={String(form.floor)} onChange={e => setForm({ ...form, floor: e.target.value })} className="st-select">
                                <option value="">-- выберите этаж --</option>
                                {[1, 2, 3, 4, 5].map(f => <option key={f} value={f}>{f}</option>)}
                            </select>

                            <label>Вместимость</label>
                            <input type="number" min="1" max="100" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} className="st-input" />

                            <label>Статус</label>
                            <select value={String(form.statusId)} onChange={e => setForm({ ...form, statusId: e.target.value })} className="st-select">
                                <option value="">-- выберите статус --</option>
                                {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>

                            <label className="st-checkbox-row">
                                <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Активен
                            </label>

                            <div className="st-section-title">Оборудование в кабинете</div>
                            <ul className="st-input">
                                {form.equipments.map(e => (
                                    <li key={e.equipmentId}>{e.equipmentName}: {e.quantity}</li>
                                ))}
                            </ul>
                            <button type="button" className="st-btn-full" onClick={openEquipModal}>Добавить оборудование</button>

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

            {/* модалка выбора оборудования */}
            {isEquipModalOpen && (
                <EquipmentSelectModal
                    cabinetId={editingId}
                    selected={form.equipments}
                    onApply={onEquipApply}
                    onCancel={closeEquipModal}
                />
            )}
        </div>
    )
}
