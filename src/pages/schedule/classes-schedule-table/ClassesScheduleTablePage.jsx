import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { authFetch } from '../../../apiClient.js';
import { useAuth } from '../../../components/auth/AuthContext.jsx';
import './ClassesScheduleTablePage.css';

export default function ClassesScheduleTablePage() {
    const { role } = useAuth();
    const canEdit = role === 'ROLE_SCHEDULER' || role === 'ROLE_ADMIN';
    const { classLabel } = useParams();

    const [classId, setClassId] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [days, setDays] = useState([]);
    const [scheduleMatrix, setScheduleMatrix] = useState(
        Array.from({ length: 7 }, () => Array.from({ length: 6 }, () => null))
    );

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({ lessonNumber: null, dayIndex: null, eventId: null });

    const [eventTypes, setEventTypes] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [availableCabinets, setAvailableCabinets] = useState([]);

    const [equipmentTypes, setEquipmentTypes] = useState([]);
    const [cabinetTypes, setCabinetTypes] = useState([]);
    const [equipmentRequirements, setEquipmentRequirements] = useState([]);

    const [formData, setFormData] = useState({
        eventTypeId: '',
        subjectId: '',
        teacherId: '',
        cabinetId: '',
        autoCabinet: true,
        minCapacity: '',
        floor: '',
        cabinetTypeId: ''
    });

    const lessonTimes = [
        '08:00 – 08:45', '08:55 – 09:40', '09:50 – 10:35',
        '10:45 – 11:30', '11:40 – 12:25', '12:35 – 13:20', '13:30 – 14:15'
    ];

    const prevWeek = () => setSelectedDate(d => { d = new Date(d); d.setDate(d.getDate() - 7); return d; });
    const nextWeek = () => setSelectedDate(d => { d = new Date(d); d.setDate(d.getDate() + 7); return d; });

    useEffect(() => {
        authFetch('/api/v1/classes')
            .then(res => res.json())
            .then(list => {
                const found = list.find(c => `${c.grade}${c.section}` === classLabel);
                if (found) setClassId(found.id);
            });
    }, [classLabel]);

    useEffect(() => {
        authFetch('/api/v1/event-types/list?active=true').then(res => res.json()).then(data => {
            setEventTypes(data);
            if (data.length) setFormData(f => ({ ...f, eventTypeId: data[0].id.toString() }));
        });
        authFetch('/api/v1/subjects/list').then(res => res.json()).then(setSubjects);
    }, []);

    useEffect(() => {
        if (formData.subjectId) {
            authFetch(`/api/v1/teachers/list?subjectId=${formData.subjectId}`)
                .then(res => res.json())
                .then(setTeachers);
        } else {
            setTeachers([]);
            setFormData(f => ({ ...f, teacherId: '' }));
        }
    }, [formData.subjectId]);

    useEffect(() => {
        authFetch('/api/v1/equipment-types/list').then(res => res.json()).then(setEquipmentTypes);
        authFetch('/api/v1/cabinet-types/list').then(res => res.json()).then(setCabinetTypes);
    }, []);

    const getMonday = date => {
        const d = new Date(date);
        const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
        d.setDate(d.getDate() + diff);
        return d;
    };
    const formatDate = d =>
        `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;

    useEffect(() => {
        if (!classId) return;
        const monday = getMonday(selectedDate);
        monday.setHours(0, 0, 0, 0);

        const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const newDays = dayNames.map((n, i) => {
            const dd = new Date(monday);
            dd.setDate(monday.getDate() + i);
            return `${n} ${formatDate(dd)}`;
        });
        setDays(newDays);

        const iso = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
        setScheduleMatrix(Array.from({ length: 7 }, () => Array(6).fill(null)));

        authFetch(`/api/v1/schedule?classId=${classId}&date=${iso}`)
            .then(res => res.json())
            .then(events => {
                const matrix = Array.from({ length: 7 }, () => Array(6).fill(null));
                events.forEach(evt => {
                    const d = new Date(evt.eventDate);
                    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                    const diff = Math.floor((dateOnly - monday) / (1000 * 60 * 60 * 24));
                    const row = evt.lessonNumber - 1;
                    if (diff >= 0 && diff < 6 && row >= 0 && row < 7) matrix[row][diff] = evt;
                });
                setScheduleMatrix(matrix);
            });
    }, [classId, selectedDate]);

    const handleEventTypeChange = e => {
        const eventTypeId = e.target.value;
        const sel = eventTypes.find(t => t.id.toString() === eventTypeId);
        setFormData(f => ({
            ...f,
            eventTypeId,
            subjectId: sel?.requiresSubject ? f.subjectId : ''
        }));
    };

    const handleCellClick = (lessonNumber, dayIndex, event) => {
        if (!canEdit) return;
        const monday = getMonday(selectedDate);
        const eventDate = new Date(monday);
        eventDate.setDate(monday.getDate() + dayIndex);
        setModalData({ lessonNumber, dayIndex, eventId: event?.id || null });

        const isoDate = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
        authFetch(`/api/v1/cabinets/available?date=${isoDate}&lessonNumber=${lessonNumber}`)
            .then(res => res.json())
            .then(cabs => {
                cabs.sort((a, b) => parseInt(a.number) - parseInt(b.number));
                let found = null;
                if (event?.cabinetId) {
                    found = cabs.find(c => c.id === event.cabinetId) || { id: event.cabinetId, number: event.cabinetNumber };
                    if (!cabs.find(c => c.id === found.id)) cabs.push(found);
                    cabs.sort((a, b) => parseInt(a.number) - parseInt(b.number));
                }
                setAvailableCabinets(cabs);

                if (event) {
                    const et = eventTypes.find(t => t.name === event.eventTypeName);
                    const sb = subjects.find(s => s.name === event.subjectName);
                    setFormData({
                        eventTypeId: et?.id?.toString() || '',
                        subjectId: sb?.id?.toString() || '',
                        teacherId: '',
                        cabinetId: found?.id?.toString() || '',
                        autoCabinet: false
                    });
                } else {
                    setFormData(f => ({ ...f, subjectId: '', teacherId: '', cabinetId: '', autoCabinet: true }));
                }

                setEquipmentRequirements([]);
                setShowModal(true);
            });
    };

    const handleFormChange = e => {
        const { name, value } = e.target;
        setFormData(f => ({ ...f, [name]: value }));
    };

    const handleAutoCabinetChange = e => {
        const autoCab = e.target.checked;
        setFormData(f => ({ ...f, autoCabinet: autoCab, cabinetId: autoCab ? '' : f.cabinetId }));
    };

    const handleAddEquipment = () =>
        setEquipmentRequirements(r => [...r, { typeId: '', requiredQuantity: 1 }]);

    const handleEquipmentChange = (i, field, val) =>
        setEquipmentRequirements(r => {
            const nr = [...r];
            nr[i] = { ...nr[i], [field]: field === 'requiredQuantity' ? Number(val) : val };
            return nr;
        });

    const handleRemoveEquipment = i =>
        setEquipmentRequirements(r => r.filter((_, idx) => idx !== i));

    const handleFindCabinetClick = async () => {
        const monday = getMonday(selectedDate);
        const eventDate = new Date(monday);
        eventDate.setDate(monday.getDate() + modalData.dayIndex);
        const isoDate = `${eventDate.getFullYear()}-${String(eventDate.getMonth()+1).padStart(2,'0')}-${String(eventDate.getDate()).padStart(2,'0')}`;

        try {
            const res = await authFetch(`/api/v1/cabinets/available/one`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: isoDate,
                    lessonNumber: modalData.lessonNumber,
                    equipmentRequirements: equipmentRequirements.filter(r => r.typeId && r.requiredQuantity),
                    floor: formData.floor,
                    minCapacity: formData.minCapacity,
                    cabinetTypeId: formData.cabinetTypeId
                })
            });

            if (res.status === 204) {
                alert('Подходящий кабинет не найден');
                setFormData(f => ({ ...f, cabinetId: '' }));
                return;
            }

            if (res.ok) {
                const cab = await res.json();
                if (cab?.id) setFormData(f => ({ ...f, cabinetId: cab.id.toString() }));
            }
        } catch {
            alert('Ошибка при поиске кабинета');
        }
    };

    const handleSubmit = () => {
        const monday = getMonday(selectedDate);
        monday.setHours(0, 0, 0, 0);
        const eventDateObj = new Date(monday);
        eventDateObj.setDate(monday.getDate() + modalData.dayIndex);

        if (eventDateObj < new Date(new Date().setHours(0,0,0,0))) {
            alert('Дата не может быть в прошлом');
            return;
        }

        if (!formData.eventTypeId) {
            alert('Заполните все обязательные поля');
            return;
        }

        const req = {
            eventDate: `${eventDateObj.getFullYear()}-${String(eventDateObj.getMonth()+1).padStart(2,'0')}-${String(eventDateObj.getDate()).padStart(2,'0')}`,
            lessonNumber: modalData.lessonNumber,
            eventTypeId: parseInt(formData.eventTypeId),
            subjectId: formData.subjectId ? parseInt(formData.subjectId) : null,
            teacherId: parseInt(formData.teacherId),
            cabinetId: parseInt(formData.cabinetId),
            schoolClassId: classId
        };

        const url = modalData.eventId ? `/api/v1/schedule/${modalData.eventId}` : '/api/v1/schedule';
        const method = modalData.eventId ? 'PUT' : 'POST';

        authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req) })
            .then(() => setShowModal(false))
            .then(() => setSelectedDate(d => new Date(d)));
    };

    const handleDelete = () => {
        if (!modalData.eventId || !confirm('Удалить событие?')) return;
        authFetch(`/api/v1/schedule/${modalData.eventId}`, { method: 'DELETE' })
            .then(() => setShowModal(false))
            .then(() => setSelectedDate(d => new Date(d)));
    };

    const monday = getMonday(selectedDate);
    monday.setHours(0, 0, 0, 0);
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    const periodLabel = `${formatDate(monday)} – ${formatDate(saturday)}`;

    const selectedEventType = eventTypes.find(t => t.id.toString() === formData.eventTypeId);
    const requiresSubject = selectedEventType?.requiresSubject;

    return (
        <div className="st-container">
            <div className="st-header">Расписание класса {classLabel}</div>

            {/* навигация по неделям */}
            <div className="st-nav">
                <button className="st-nav-button" onClick={prevWeek}>&lt;</button>
                <div className="st-period">{periodLabel}</div>
                <button className="st-nav-button" onClick={nextWeek}>&gt;</button>
            </div>

            {/* таблица расписания */}
            <table className="st-table">
                <thead>
                <tr>
                    <th className="st-th">Урок</th>
                    {days.map((d, i) => <th key={i} className="st-th">{d}</th>)}
                </tr>
                </thead>
                <tbody>
                {scheduleMatrix.map((row, i) => (
                    <tr key={i}>
                        <td className="st-td">
                            <div>{i + 1}</div>
                            <div className="st-time">{lessonTimes[i]}</div>
                        </td>
                        {row.map((cell, j) => (
                            <td
                                key={j}
                                className={`st-td ${!cell && canEdit ? 'st-td-pointer' : ''}`}
                                style={cell ? { backgroundColor: cell.eventTypeColor } : null}
                                onClick={() => handleCellClick(i + 1, j, cell)}
                            >
                                {cell ? (
                                    <>
                                        <div>{cell.cabinetNumber}</div>
                                        <div className="st-eventName">{cell.subjectName || cell.eventTypeName}</div>
                                        <div>{cell.teacherFullName}</div>
                                    </>
                                ) : canEdit ? (
                                    <div className="st-plus">+</div>
                                ) : null}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>

            {/* легенда типов событий */}
            {eventTypes.length > 0 && (
                <div className="st-legend">
                    {eventTypes.map(type => (
                        <div key={type.id} className="st-legend-item">
                            <div className="st-legend-color" style={{ backgroundColor: type.color }} />
                            <span className="st-legend-text">{type.name}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* модалка */}
            {showModal && canEdit && (
                <div className="st-modal-overlay">
                    <div className="st-modal">
                        <div className="st-modal-header">
                            <h3 className="st-modal-title">{modalData.eventId ? 'Редактировать событие' : 'Добавить событие'}</h3>
                            <p className="st-modal-subtitle">Урок {modalData.lessonNumber}, {days[modalData.dayIndex]}</p>
                        </div>
                        <select name="eventTypeId" value={formData.eventTypeId} onChange={handleEventTypeChange} className="st-select">
                            {eventTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <select name="subjectId" value={formData.subjectId} onChange={handleFormChange} className="st-select" disabled={!requiresSubject}>
                            <option value="">Выберите предмет</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select name="teacherId" value={formData.teacherId} onChange={handleFormChange} className="st-select" disabled={!formData.subjectId}>
                            <option value="">Выберите учителя</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                        </select>
                        <div className="st-checkbox-row">
                            <input type="checkbox" id="autoCabinet" checked={formData.autoCabinet} onChange={handleAutoCabinetChange} />
                            <label htmlFor="autoCabinet">Автоматический подбор кабинета</label>
                        </div>
                        <select name="cabinetId" value={formData.cabinetId} onChange={handleFormChange} className="st-select" disabled={formData.autoCabinet}>
                            <option value="">Выберите кабинет</option>
                            {availableCabinets.map(c => <option key={c.id} value={c.id}>{c.number}</option>)}
                        </select>

                        {formData.autoCabinet && (
                            <>
                                <h5 className="st-section-title">Требуемое оборудование:</h5>
                                {equipmentRequirements.map((req, i) => (
                                    <div key={i} className="st-eq-row">
                                        <select value={req.typeId} onChange={e => handleEquipmentChange(i, 'typeId', e.target.value)} className="st-select-medium">
                                            <option value="">Тип оборудования</option>
                                            {equipmentTypes.map(et => <option key={et.id} value={et.id}>{et.name}</option>)}
                                        </select>
                                        <select value={req.requiredQuantity} onChange={e => handleEquipmentChange(i, 'requiredQuantity', e.target.value)} className="st-select-small">
                                            {[...Array(50).keys()].map(n => <option key={n+1} value={n+1}>{n+1}</option>)}
                                        </select>
                                        <button className="st-btn-small st-btn-delete" onClick={() => handleRemoveEquipment(i)}>✕</button>
                                    </div>
                                ))}
                                <button className="st-btn-full" onClick={handleAddEquipment}>Добавить оборудование</button>

                                <h5 className="st-section-title">Дополнительные параметры:</h5>
                                <input type="number" name="minCapacity" placeholder="Мин. вместимость" className="st-input" min="1" max="500" value={formData.minCapacity} onChange={handleFormChange} />
                                <select name="floor" value={formData.floor} onChange={handleFormChange} className="st-select">
                                    <option value="">Любой этаж</option>
                                    {[1,2,3,4,5].map(f => <option key={f} value={f}>{f} этаж</option>)}
                                </select>
                                <select name="cabinetTypeId" value={formData.cabinetTypeId} onChange={handleFormChange} className="st-select">
                                    <option value="">Любой тип кабинета</option>
                                    {cabinetTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <button className="st-btn-full" onClick={handleFindCabinetClick}>Найти подходящий кабинет</button>
                            </>
                        )}

                        <div className="st-modal-footer">
                            {modalData.eventId && <button className="st-btn st-btn-delete" onClick={handleDelete}>Удалить</button>}
                            <div style={{ flex: 1 }} />
                            <button className="st-btn" onClick={() => setShowModal(false)}>Отмена</button>
                            <button className="st-btn" onClick={handleSubmit} disabled={!formData.eventTypeId}>
                                Сохранить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
