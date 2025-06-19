import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { authFetch } from '../../../apiClient.js';
import { useAuth } from '../../../components/auth/AuthContext.jsx';
import './TeacherScheduleTablePage.css';

export default function TeacherScheduleTablePage() {
    const { role } = useAuth();
    const canEdit = role === 'ROLE_SCHEDULER' || role === 'ROLE_ADMIN';
    const { teacherId } = useParams();

    const [teacherName, setTeacherName] = useState('');
    const [classes, setClasses] = useState([]);
    const [eventTypes, setEventTypes] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [cabinetTypes, setCabinetTypes] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);
    const [equipmentRequirements, setEquipmentRequirements] = useState([]);
    const [availableCabinets, setAvailableCabinets] = useState([]);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [days, setDays] = useState([]);
    const [scheduleMatrix, setScheduleMatrix] = useState(
        Array.from({ length: 7 }, () => Array(6).fill(null))
    );

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({ lessonNumber: null, dayIndex: null, eventId: null });

    const [formData, setFormData] = useState({
        eventTypeId: '',
        subjectId: '',
        schoolClassId: '',
        cabinetId: '',
        autoCabinet: true,
        teacherId: teacherId,
        minCapacity: '',
        floor: '',
        cabinetTypeId: ''
    });

    const lessonTimes = [
        '08:00 - 08:45', '08:55 - 09:40', '09:50 - 10:35',
        '10:45 - 11:30', '11:40 - 12:25', '12:35 - 13:20',
        '13:30 - 14:15'
    ];

    useEffect(() => {
        authFetch('/api/v1/teachers/list')
            .then(res => res.json())
            .then(data => {
                const t = data.find(x => x.id === Number(teacherId));
                if (t) setTeacherName(t.fullName);
            });

        Promise.all([
            authFetch('/api/v1/classes').then(res => res.json()),
            authFetch('/api/v1/event-types/list?active=true').then(res => res.json()),
            authFetch(`/api/v1/subjects/list?teacherId=${teacherId}`).then(res => res.json()),
            authFetch('/api/v1/equipment-types/list').then(res => res.json()),
            authFetch('/api/v1/cabinet-types/list').then(res => res.json())
        ]).then(([classesData, eventTypesData, subjectsData, equipmentTypesData, cabinetTypesData]) => {
            setClasses(classesData);
            setEventTypes(eventTypesData);
            setSubjects(subjectsData);
            setEquipmentTypes(equipmentTypesData);
            setCabinetTypes(cabinetTypesData);
            if (eventTypesData.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    eventTypeId: eventTypesData[0].id.toString(),
                    schoolClassId: classesData[0]?.id.toString() || ''
                }));
            }
        });
    }, [teacherId]);

    function getMonday(date) {
        const d = new Date(date);
        const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
        d.setDate(d.getDate() + diff);
        return d;
    }

    function formatDate(d) {
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    function refreshSchedule() {
        const monday = getMonday(selectedDate);
        monday.setHours(0, 0, 0, 0);
        const iso = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

        authFetch(`/api/v1/schedule/teacher/${teacherId}?date=${iso}`)
            .then(res => res.json())
            .then(events => {
                const matrix = Array.from({ length: 7 }, () => Array(6).fill(null));
                events.forEach(evt => {
                    const d = new Date(evt.eventDate);
                    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                    const diff = Math.floor((dateOnly.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
                    const row = evt.lessonNumber - 1;
                    if (diff >= 0 && diff < 6 && row >= 0 && row < 7) matrix[row][diff] = evt;
                });
                setScheduleMatrix(matrix);
            });
    }

    useEffect(() => {
        const monday = getMonday(selectedDate);
        monday.setHours(0, 0, 0, 0);
        const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

        const newDays = dayNames.map((n, i) => {
            const dd = new Date(monday);
            dd.setDate(monday.getDate() + i);
            return `${n} ${formatDate(dd)}`;
        });

        setDays(newDays);
        refreshSchedule();
    }, [teacherId, selectedDate]);

    const prevWeek = () => setSelectedDate(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; });
    const nextWeek = () => setSelectedDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; });

    const handleEventTypeChange = e => {
        const id = e.target.value;
        const sel = eventTypes.find(t => t.id.toString() === id);
        setFormData(prev => ({
            ...prev,
            eventTypeId: id,
            subjectId: sel?.requiresSubject ? prev.subjectId : ''
        }));
    };

    const handleFormChange = e => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (Number(formData.minCapacity) > 500) {
            alert('Вместимость не может превышать 500');
            setFormData(prev => ({ ...prev, [name]: 0 }));
        }
    };

    const handleAutoCabinetChange = e => {
        const autoCabinet = e.target.checked;
        setFormData(prev => ({
            ...prev,
            autoCabinet,
            cabinetId: autoCabinet ? '' : prev.cabinetId
        }));
    };

    const handleReqChange = (i, field, value) => {
        const arr = [...equipmentRequirements];
        arr[i] = { ...arr[i], [field]: value };
        setEquipmentRequirements(arr);
    };

    const addRequirement = () => setEquipmentRequirements(prev => [...prev, { typeId: '', requiredQuantity: '1' }]);
    const removeRequirement = i => setEquipmentRequirements(prev => prev.filter((_, idx) => idx !== i));

    const handleFindCabinetClick = async () => {
        const monday = getMonday(selectedDate);
        const eventDate = new Date(monday);
        eventDate.setDate(monday.getDate() + modalData.dayIndex);
        const iso = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;

        try {
            const res = await authFetch('/api/v1/cabinets/available/one', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: iso,
                    lessonNumber: modalData.lessonNumber,
                    equipmentRequirements: equipmentRequirements.filter(r => r.typeId && r.requiredQuantity),
                    floor: formData.floor,
                    minCapacity: formData.minCapacity,
                    cabinetTypeId: formData.cabinetTypeId
                })
            });

            if (res.status === 204) {
                alert('Подходящий кабинет не найден');
                setFormData(prev => ({ ...prev, cabinetId: '' }));
                return;
            }

            if (res.ok) {
                const cab = await res.json();
                if (cab?.id) setFormData(prev => ({ ...prev, cabinetId: cab.id.toString() }));
            }
        } catch {
            alert('Произошла ошибка при поиске кабинета');
        }
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
                let foundCabinet = null;

                if (event?.cabinetId) {
                    foundCabinet = cabs.find(c => c.id === event.cabinetId);
                    if (!foundCabinet && event.cabinetNumber) {
                        foundCabinet = { id: event.cabinetId, number: event.cabinetNumber };
                        cabs.push(foundCabinet);
                        cabs.sort((a, b) => parseInt(a.number) - parseInt(b.number));
                    }
                }

                setAvailableCabinets(cabs);

                if (event) {
                    const foundType = eventTypes.find(t => t.name === event.eventTypeName);
                    const foundSubject = subjects.find(s => s.name === event.subjectName);

                    setFormData({
                        eventTypeId: foundType?.id?.toString() || '',
                        subjectId: foundSubject?.id?.toString() || '',
                        teacherId: teacherId,
                        schoolClassId: event.classId?.toString() || '',
                        cabinetId: foundCabinet?.id?.toString() || '',
                        autoCabinet: false,
                        minCapacity: '',
                        floor: '',
                        cabinetTypeId: ''
                    });
                } else {
                    setFormData(prev => ({
                        ...prev,
                        subjectId: '',
                        teacherId: teacherId,
                        schoolClassId: classes[0]?.id.toString() || '',
                        cabinetId: '',
                        autoCabinet: true
                    }));
                }

                setEquipmentRequirements([]);
                setShowModal(true);
            });
    };

    const handleSubmit = () => {
        const monday = getMonday(selectedDate);
        monday.setHours(0, 0, 0, 0);
        const eventDate = new Date(monday);
        eventDate.setDate(monday.getDate() + modalData.dayIndex);

        const payload = {
            eventDate: `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`,
            lessonNumber: modalData.lessonNumber,
            eventTypeId: parseInt(formData.eventTypeId),
            subjectId: formData.subjectId ? parseInt(formData.subjectId) : null,
            teacherId: parseInt(formData.teacherId),
            cabinetId: parseInt(formData.cabinetId),
            schoolClassId: parseInt(formData.schoolClassId)
        };

        const url = modalData.eventId ? `/api/v1/schedule/${modalData.eventId}` : '/api/v1/schedule';
        const method = modalData.eventId ? 'PUT' : 'POST';

        authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            .then(() => { setShowModal(false); refreshSchedule(); });
    };

    const handleDelete = () => {
        if (!modalData.eventId) return;
        if (!confirm('Вы уверены, что хотите удалить это событие?')) return;

        authFetch(`/api/v1/schedule/${modalData.eventId}`, { method: 'DELETE' })
            .then(() => { setShowModal(false); refreshSchedule(); });
    };

    const monday = getMonday(selectedDate);
    monday.setHours(0, 0, 0, 0);

    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);

    const periodLabel = `${formatDate(monday)} - ${formatDate(saturday)}`;

    const selectedEventType = eventTypes.find(t => t.id.toString() === formData.eventTypeId);
    const requiresSubject = selectedEventType?.requiresSubject;

    return (
        <div className="st-container">
            {/* заголовок и навигация */}
            <div className="st-header">Расписание преподавателя: {teacherName}</div>
            <div className="st-nav">
                <button className="st-nav-button" onClick={prevWeek}><ArrowLeft size={16} /></button>
                <div className="st-period">{periodLabel}</div>
                <button className="st-nav-button" onClick={nextWeek}><ArrowRight size={16} /></button>
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
                                        <div className="st-eventName">{cell.subjectName}</div>
                                        <div>
                                            {(() => {
                                                const cls = classes.find(c => c.id === cell.classId);
                                                return cls ? `${cls.grade}${cls.section}` : '';
                                            })()}
                                        </div>
                                    </>
                                ) : canEdit ? <div className="st-plus">+</div> : <div className="st-plus">-</div>}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>

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
                            <h3 className="st-modal-title">
                                {modalData.eventId ? 'Редактировать событие' : 'Добавить событие'}
                            </h3>
                            <p className="st-modal-subtitle">
                                Урок {modalData.lessonNumber}, {days[modalData.dayIndex]}
                            </p>
                        </div>

                        <select
                            name="eventTypeId"
                            value={formData.eventTypeId}
                            onChange={handleEventTypeChange}
                            className="st-select"
                            required
                        >
                            {eventTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>

                        <select
                            name="subjectId"
                            value={formData.subjectId}
                            onChange={handleFormChange}
                            className="st-select"
                            disabled={!requiresSubject}
                            required={requiresSubject}
                        >
                            <option value="">Выберите предмет</option>
                            {subjects.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>

                        <select
                            name="schoolClassId"
                            value={formData.schoolClassId}
                            onChange={handleFormChange}
                            className="st-select"
                            required
                        >
                            <option value="">Выберите класс</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.grade}{c.section}</option>
                            ))}
                        </select>

                        <div className="st-checkbox-row">
                            <input
                                type="checkbox"
                                id="autoCabinet"
                                checked={formData.autoCabinet}
                                onChange={handleAutoCabinetChange}
                            />
                            <label htmlFor="autoCabinet">Автоматический подбор кабинета</label>
                        </div>

                        <select
                            name="cabinetId"
                            value={formData.cabinetId}
                            onChange={handleFormChange}
                            className="st-select"
                            disabled={formData.autoCabinet}
                            required={!formData.autoCabinet}
                        >
                            <option value="">Выберите кабинет</option>
                            {availableCabinets.map(c => (
                                <option key={c.id} value={c.id}>{c.number}</option>
                            ))}
                        </select>

                        {formData.autoCabinet && (
                            <>
                                <h5 className="st-section-title">Требуемое оборудование:</h5>
                                {equipmentRequirements.map((req, i) => (
                                    <div key={i} className="st-eq-row">
                                        <select
                                            value={req.typeId}
                                            onChange={e => handleReqChange(i, 'typeId', e.target.value)}
                                            className="st-select-medium"
                                        >
                                            <option value="">Тип оборудования</option>
                                            {equipmentTypes.map(et => (
                                                <option key={et.id} value={et.id}>{et.name}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={req.requiredQuantity}
                                            onChange={e => handleReqChange(i, 'requiredQuantity', e.target.value)}
                                            className="st-select-small"
                                        >
                                            {[...Array(50).keys()].map(n => (
                                                <option key={n+1} value={n+1}>{n+1}</option>
                                            ))}
                                        </select>
                                        <button
                                            className="st-btn-small st-btn-delete"
                                            onClick={() => removeRequirement(i)}
                                        >✕</button>
                                    </div>
                                ))}
                                <button className="st-btn-full" onClick={addRequirement}>Добавить оборудование</button>

                                <h5 className="st-section-title">Дополнительные параметры:</h5>
                                <input
                                    type="number"
                                    name="minCapacity"
                                    placeholder="Мин. вместимость"
                                    className="st-input"
                                    value={formData.minCapacity || ''}
                                    onChange={handleFormChange}
                                    min="0"
                                    max="500"
                                />
                                <select
                                    name="floor"
                                    value={formData.floor || ''}
                                    onChange={handleFormChange}
                                    className="st-select"
                                >
                                    <option value="">Любой этаж</option>
                                    {[1,2,3,4,5].map(f => (
                                        <option key={f} value={f}>{f} этаж</option>
                                    ))}
                                </select>
                                <select
                                    name="cabinetTypeId"
                                    value={formData.cabinetTypeId || ''}
                                    onChange={handleFormChange}
                                    className="st-select"
                                >
                                    <option value="">Любой тип кабинета</option>
                                    {cabinetTypes.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <button className="st-btn-full" onClick={handleFindCabinetClick}>Найти подходящий кабинет</button>
                            </>
                        )}

                        <div className="st-modal-footer">
                            {modalData.eventId && <button className="st-btn st-btn-delete" onClick={handleDelete}>Удалить</button>}
                            <div style={{ flex: 1 }} />
                            <button className="st-btn" onClick={() => setShowModal(false)}>Отмена</button>
                            <button
                                className="st-btn"
                                onClick={handleSubmit}
                                disabled={
                                    !formData.teacherId ||
                                    !formData.schoolClassId ||
                                    (!formData.autoCabinet && !formData.cabinetId) ||
                                    (requiresSubject && !formData.subjectId)
                                }
                            >Сохранить</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
