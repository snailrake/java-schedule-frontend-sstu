import React, { useState, useEffect, useMemo } from 'react'
import { authFetch } from '../../../apiClient.js'
import './EquipmentsPage.css'

export default function EquipmentsPage() {
    const [equipments, setEquipments] = useState([])
    const [page, setPage] = useState(0)
    const [size, setSize] = useState(10)
    const [totalPages, setTotalPages] = useState(0)
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState({
        typeId: '',
        name: '',
        brand: '',
        model: '',
        serialNumber: '',
        quantity: '',
        statusId: '',
        active: true
    })
    const [types, setTypes] = useState([])
    const [statuses, setStatuses] = useState([])
    const [history, setHistory] = useState([])
    const [availableHistoryCabinets, setAvailableHistoryCabinets] = useState([])
    const [historyForm, setHistoryForm] = useState({
        serviceDate: '',
        lessonNumber: '',
        serviceTime: '',
        cabinetId: '',
        technician: '',
        description: ''
    })

    const today = new Date().toISOString().split('T')[0]

    const pad = n => n.toString().padStart(2, '0')
    const formatToDtoDate = iso => {
        const [y, m, d] = iso.split('-')
        return `${pad(d)}.${pad(m)}.${y}`
    }
    const parseDtoDateTime = s => {
        const [date, time] = s.split(' ')
        const [day, month, year] = date.split('.').map(Number)
        const [hour, minute] = time.split(':').map(Number)
        return new Date(year, month - 1, day, hour, minute)
    }

    const loadEquipments = () => {
        authFetch(`/api/v1/equipments?page=${page}&size=${size}`)
            .then(res => res.json())
            .then(dtoPage => {
                setEquipments(dtoPage.content)
                setTotalPages(dtoPage.totalPages)
            })
    }

    useEffect(() => {
        authFetch('/api/v1/equipment-types/list')
            .then(r => r.json())
            .then(setTypes)
        authFetch('/api/v1/equipment-statuses/list')
            .then(r => r.json())
            .then(setStatuses)
    }, [])

    useEffect(loadEquipments, [page, size])

    const filteredList = useMemo(() => {
        if (!searchTerm.trim()) return equipments
        return equipments.filter(e =>
            e.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [equipments, searchTerm])

    const openCreateModal = () => {
        setEditingId(null)
        setForm({
            typeId: '', name: '', brand: '', model: '', serialNumber: '',
            quantity: '', statusId: '', active: true
        })
        setHistory([])
        setAvailableHistoryCabinets([])
        setHistoryForm({
            serviceDate: '', lessonNumber: '', serviceTime: '', cabinetId: '', technician: '', description: ''
        })
        setIsModalOpen(true)
    }

    const openEditModal = eq => {
        setEditingId(eq.id)
        setForm({
            typeId: eq.typeId || '', name: eq.name || '', brand: eq.brand || '',
            model: eq.model || '', serialNumber: eq.serialNumber || '', quantity: eq.quantity || '',
            statusId: eq.statusId || '', active: eq.active ?? true
        })
        authFetch(`/api/v1/equipment-service-history?equipmentId=${eq.id}`)
            .then(r => r.json()).then(setHistory)
        authFetch(`/api/v1/cabinets/list?equipmentId=${eq.id}`)
            .then(r => r.json()).then(setAvailableHistoryCabinets)
        setHistoryForm({ serviceDate: '', lessonNumber: '', serviceTime: '', cabinetId: '', technician: '', description: '' })
        setIsHistoryOpen(false)
        setIsModalOpen(true)
    }

    const closeModal = () => setIsModalOpen(false)
    const openHistory = () => setIsHistoryOpen(true)
    const closeHistory = () => setIsHistoryOpen(false)

    const handleDelete = () => {
        if (!editingId) return
        if (window.confirm('Удалить оборудование?')) {
            authFetch(`/api/v1/equipments/${editingId}`, { method: 'DELETE' })
                .then(loadEquipments).then(closeModal)
        }
    }

    const handleSubmit = e => {
        e.preventDefault()
        const payload = {
            ...form,
            typeId: Number(form.typeId),
            statusId: Number(form.statusId),
            quantity: Number(form.quantity)
        }
        const method = editingId ? 'PUT' : 'POST'
        const url = editingId ? `/api/v1/equipments/${editingId}` : '/api/v1/equipments'
        authFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(loadEquipments).then(closeModal)
    }

    const handleHistorySubmit = e => {
        e.preventDefault()
        const base = { equipmentId: editingId, cabinetId: Number(historyForm.cabinetId), technician: historyForm.technician, description: historyForm.description }
        const payload = historyForm.lessonNumber
            ? { ...base, lessonNumber: Number(historyForm.lessonNumber), serviceDate: formatToDtoDate(historyForm.serviceDate) }
            : { ...base, serviceDate: formatToDtoDate(historyForm.serviceDate), serviceTime: historyForm.serviceTime }
        authFetch('/api/v1/equipment-service-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(() => authFetch(`/api/v1/equipment-service-history?equipmentId=${editingId}`)
                .then(r => r.json()).then(setHistory)
            )
            .then(closeHistory)
    }

    const now = new Date()
    const pastServices = history
        .filter(h => parseDtoDateTime(h.serviceDatetime) < now)
        .sort((a, b) => parseDtoDateTime(b.serviceDatetime) - parseDtoDateTime(a.serviceDatetime))
    const upcomingServices = history
        .filter(h => parseDtoDateTime(h.serviceDatetime) >= now)
        .sort((a, b) => parseDtoDateTime(a.serviceDatetime) - parseDtoDateTime(b.serviceDatetime))

    return (
        // страница
        <div className="equip-page">
            <div className="equip-header">
                <h1>Оборудование</h1>
                <input type="text" placeholder="Поиск" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <button onClick={openCreateModal}>Добавить</button>
            </div>

            {/* таблица */}
            <div className="equip-table-container">
                <table className="equip-table">
                    <thead>
                    <tr>
                        <th>Тип</th>
                        <th>Наименование</th>
                        <th>Бренд</th>
                        <th>Модель</th>
                        <th>Серийный №</th>
                        <th>Количество</th>
                        <th>Статус</th>
                        <th>Активен</th>
                        <th>Доступно</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredList.map(eq => (
                        <tr key={eq.id} onClick={() => openEditModal(eq)}>
                            <td>{eq.typeName}</td>
                            <td>{eq.name}</td>
                            <td>{eq.brand}</td>
                            <td>{eq.model}</td>
                            <td>{eq.serialNumber}</td>
                            <td>{eq.quantity}</td>
                            <td>{eq.statusName}</td>
                            <td>{eq.active ? 'Да' : 'Нет'}</td>
                            <td>{eq.availableQuantity}</td>
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
                                {editingId ? 'Редактировать оборудование' : 'Добавить оборудование'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <select value={form.typeId} onChange={e => setForm({ ...form, typeId: e.target.value })} className="st-select" required>
                                <option value="">-- выберите --</option>
                                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <input type="text" placeholder="Наименование" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="st-input" required maxLength={100} />
                            <input type="text" placeholder="Бренд" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="st-input" maxLength={50} />
                            <input type="text" placeholder="Модель" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="st-input" maxLength={50} />
                            <input type="text" placeholder="Серийный №" value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} className="st-input" maxLength={50} />
                            <input type="number" placeholder="Количество" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="st-input" required min={1} max={10000} step={1} />
                            <select value={form.statusId} onChange={e => setForm({ ...form, statusId: e.target.value })} className="st-select" required>
                                <option value="">-- выберите --</option>
                                {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <label className="st-checkbox-row"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Активен</label>
                            <div className="st-modal-footer">
                                {editingId && <button type="button" className="st-btn st-btn-history" onClick={openHistory}>История обслуживания</button>}
                                {editingId && <button type="button" className="st-btn st-btn-delete" onClick={handleDelete}>Удалить</button>}
                                <button type="button" className="st-btn" onClick={closeModal}>Отмена</button>
                                <button type="submit" className="st-btn">Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* история обслуживания */}
            {isHistoryOpen && (
                <div className="st-modal-overlay" onClick={closeHistory}>
                    <div className="st-modal" onClick={e => e.stopPropagation()}>
                        <div className="st-modal-header">
                            <h3 className="st-modal-title">История обслуживания</h3>
                        </div>
                        {pastServices.length > 0 && (
                            <>
                                <h4>Прошлые обслуживания</h4>
                                <div className="history-cards">
                                    {pastServices.map(h => (
                                        <div key={h.id} className="history-card">
                                            <div className="history-card-date">{h.serviceDatetime}</div>
                                            <div className="history-card-item">Кабинет: {h.cabinetNumber}</div>
                                            <div className="history-card-item">Техник: {h.technician}</div>
                                            <div className="history-card-item">{h.description}</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {upcomingServices.length > 0 && (
                            <>
                                <h4>Предстоящие обслуживания</h4>
                                <div className="history-cards">
                                    {upcomingServices.map(h => (
                                        <div key={h.id} className="history-card">
                                            <div className="history-card-date">{h.serviceDatetime}</div>
                                            <div className="history-card-item">Кабинет: {h.cabinetNumber}</div>
                                            <div className="history-card-item">Техник: {h.technician}</div>
                                            <div className="history-card-item">{h.description}</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {pastServices.length === 0 && upcomingServices.length === 0 && <p>Записей нет</p>}
                        <form onSubmit={handleHistorySubmit}>
                            <div className="history-time-type">
                                <label><input type="radio" name="timeType" checked={!!historyForm.lessonNumber} onChange={() => setHistoryForm({ ...historyForm, lessonNumber: '1', serviceTime: '' })} /> По уроку</label>
                                <label><input type="radio" name="timeType" checked={!historyForm.lessonNumber} onChange={() => setHistoryForm({ ...historyForm, lessonNumber: '', serviceTime: '' })} /> Произвольно</label>
                            </div>
                            <input type="date" value={historyForm.serviceDate} onChange={e => setHistoryForm({ ...historyForm, serviceDate: e.target.value })} className="st-input" required min={today} />
                            {historyForm.lessonNumber ? (
                                <select value={historyForm.lessonNumber} onChange={e => setHistoryForm({ ...historyForm, lessonNumber: e.target.value })} className="st-select" required>
                                    {[...Array(7)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                                </select>
                            ) : (
                                <input type="time" value={historyForm.serviceTime} onChange={e => setHistoryForm({ ...historyForm, serviceTime: e.target.value })} className="st-input" required />
                            )}
                            <select value={historyForm.cabinetId} onChange={e => setHistoryForm({ ...historyForm, cabinetId: e.target.value })} className="st-select" required>
                                <option value="">-- выберите --</option>
                                {availableHistoryCabinets.map(c => <option key={c.id} value={c.id}>{c.number}</option>)}
                            </select>
                            <input type="text" placeholder="Техник" value={historyForm.technician} onChange={e => setHistoryForm({ ...historyForm, technician: e.target.value })} className="st-input" required maxLength={100} />
                            <textarea placeholder="Описание" value={historyForm.description} onChange={e => setHistoryForm({ ...historyForm, description: e.target.value })} className="st-input" maxLength={500} />
                            <div className="st-modal-footer">
                                <button type="button" className="st-btn" onClick={closeHistory}>Отмена</button>
                                <button type="submit" className="st-btn">Запланировать</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
