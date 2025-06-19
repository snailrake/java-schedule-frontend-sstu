import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { authFetch } from '../../../apiClient.js'
import { useAuth } from '../../../components/auth/AuthContext.jsx'
import './CabinetScheduleTable.css'

export default function CabinetScheduleTable() {
    const { role } = useAuth()
    const canEdit = role === 'ROLE_SCHEDULER' || role === 'ROLE_ADMIN'
    const { cabinetId } = useParams()

    const [cabinetNumber, setCabinetNumber] = useState('')
    const [classes, setClasses] = useState([])
    const [eventTypes, setEventTypes] = useState([])
    const [subjects, setSubjects] = useState([])
    const [teachers, setTeachers] = useState([])
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [days, setDays] = useState([])
    const [scheduleMatrix, setScheduleMatrix] = useState(
        Array.from({ length: 7 }, () => Array(6).fill(null))
    )
    const [showModal, setShowModal] = useState(false)
    const [modalData, setModalData] = useState({ lessonNumber: null, dayIndex: null, eventId: null })
    const [formData, setFormData] = useState({
        eventTypeId: '', subjectId: '', teacherId: '', schoolClassId: ''
    })

    const lessonTimes = [
        '08:00 – 08:45', '08:55 – 09:40', '09:50 – 10:35',
        '10:45 – 11:30', '11:40 – 12:25', '12:35 – 13:20', '13:30 – 14:15'
    ]

    useEffect(() => {
        authFetch('/api/v1/cabinets/list')
            .then(res => res.json())
            .then(data => {
                const cab = data.find(c => c.id === Number(cabinetId))
                if (cab) setCabinetNumber(cab.number)
            })
        authFetch('/api/v1/classes').then(r => r.json()).then(setClasses)
        authFetch('/api/v1/event-types/list?active=true').then(r => r.json()).then(setEventTypes)
        authFetch('/api/v1/subjects/list').then(r => r.json()).then(setSubjects)
    }, [cabinetId])

    useEffect(() => {
        if (formData.subjectId) {
            authFetch(`/api/v1/teachers/list?subjectId=${formData.subjectId}`)
                .then(r => r.json()).then(setTeachers)
        } else {
            setTeachers([])
            setFormData(prev => ({ ...prev, teacherId: '' }))
        }
    }, [formData.subjectId])

    function getMonday(date) {
        const d = new Date(date)
        const diff = d.getDay() === 0 ? -6 : 1 - d.getDay()
        d.setDate(d.getDate() + diff)
        return d
    }

    function formatDate(d) {
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth()+1).padStart(2,'0')}`
    }

    function refreshSchedule() {
        const monday = getMonday(selectedDate)
        monday.setHours(0,0,0,0)
        const iso = `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`
        authFetch(`/api/v1/schedule/cabinet/${cabinetId}?date=${iso}`)
            .then(res => res.json())
            .then(events => {
                const matrix = Array.from({ length: 7 }, () => Array(6).fill(null))
                events.forEach(evt => {
                    const d = new Date(evt.eventDate)
                    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate())
                    const diff = Math.round((dateOnly - monday)/(1000*60*60*24))
                    const row = evt.lessonNumber - 1
                    if (diff>=0 && diff<6 && row>=0 && row<7) matrix[row][diff] = evt
                })
                setScheduleMatrix(matrix)
            })
    }

    useEffect(() => {
        const monday = getMonday(selectedDate)
        monday.setHours(0,0,0,0)
        const names = ['Пн','Вт','Ср','Чт','Пт','Сб']
        const newDays = names.map((n,i) => {
            const dd = new Date(monday)
            dd.setDate(monday.getDate()+i)
            return `${n} ${formatDate(dd)}`
        })
        setDays(newDays)
        refreshSchedule()
    }, [cabinetId, selectedDate])

    const prevWeek = () => setSelectedDate(p => { const d = new Date(p); d.setDate(d.getDate()-7); return d })
    const nextWeek = () => setSelectedDate(p => { const d = new Date(p); d.setDate(d.getDate()+7); return d })

    const handleEventTypeChange = e => {
        const eventTypeId = e.target.value
        const sel = eventTypes.find(t => t.id.toString()===eventTypeId)
        setFormData(prev => ({
            ...prev,
            eventTypeId,
            subjectId: sel?.requiresSubject ? prev.subjectId : ''
        }))
    }

    const handleCellClick = (lessonNumber, dayIndex, event) => {
        if (!canEdit) return
        const monday = getMonday(selectedDate)
        setModalData({ lessonNumber, dayIndex, eventId: event?.id||null })
        if (event) {
            const ft = eventTypes.find(t=>t.name===event.eventTypeName)
            const fs = subjects.find(s=>s.name===event.subjectName)
            const fth = teachers.find(t=>t.fullName===event.teacherFullName)
            setFormData({
                eventTypeId: ft?.id?.toString()||'',
                subjectId: fs?.id?.toString()||'',
                teacherId: fth?.id?.toString()||'',
                schoolClassId: event.classId?.toString()||''
            })
        } else setFormData(prev=>({...prev,subjectId:'',teacherId:''}))
        setShowModal(true)
    }

    const handleFormChange = e => setFormData(prev=>({...prev,[e.target.name]:e.target.value}))

    const handleSubmit = () => {
        const monday = getMonday(selectedDate)
        monday.setHours(0,0,0,0)
        const eventDate = new Date(monday)
        eventDate.setDate(monday.getDate()+modalData.dayIndex)
        const payload = {
            eventDate:
                `${eventDate.getFullYear()}-${String(eventDate.getMonth()+1).padStart(2,'0')}-${String(eventDate.getDate()).padStart(2,'0')}`,
            lessonNumber:modalData.lessonNumber,
            eventTypeId:parseInt(formData.eventTypeId),
            subjectId:formData.subjectId?parseInt(formData.subjectId):null,
            teacherId:parseInt(formData.teacherId),
            cabinetId:parseInt(cabinetId),
            schoolClassId:parseInt(formData.schoolClassId)
        }
        const url = modalData.eventId ? `/api/v1/schedule/${modalData.eventId}` : '/api/v1/schedule'
        const method = modalData.eventId ? 'PUT' : 'POST'
        authFetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
            .then(()=>{ setShowModal(false); refreshSchedule() })
    }

    const handleDelete = () => {
        if (!modalData.eventId) return
        if (!confirm('Вы уверены, что хотите удалить это событие?')) return
        authFetch(`/api/v1/schedule/${modalData.eventId}`,{method:'DELETE'})
            .then(()=>{ setShowModal(false); refreshSchedule() })
    }

    const monday0 = getMonday(selectedDate)
    monday0.setHours(0,0,0,0)
    const saturday = new Date(monday0)
    saturday.setDate(monday0.getDate()+5)
    const periodLabel = `${formatDate(monday0)} – ${formatDate(saturday)}`

    const selectedEventType = eventTypes.find(t=>t.id.toString()===formData.eventTypeId)
    const requiresSubject = selectedEventType?.requiresSubject

    return (
        <div className="st-container">
            {/* навигация по неделям */}
            <div className="st-header">Расписание кабинета: {cabinetNumber}</div>
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
                    {days.map((d,i)=>(<th key={i} className="st-th">{d}</th>))}
                </tr>
                </thead>
                <tbody>
                {scheduleMatrix.map((row,i)=>(
                    <tr key={i}>
                        <td className="st-td">
                            <div>{i+1}</div>
                            <div className="st-time">{lessonTimes[i]}</div>
                        </td>
                        {row.map((cell,j)=>{
                            const cls = cell && classes.find(c=>c.id===cell.classId)
                            const label = cls?`${cls.grade}${cls.section}`:''
                            return (
                                <td
                                    key={j}
                                    className={`st-td ${!cell&&canEdit?'st-td-pointer':''}`}
                                    style={cell?{backgroundColor:cell.eventTypeColor}:null}
                                    onClick={()=>handleCellClick(i+1,j,cell)}
                                >
                                    {cell
                                        ? (<>
                                            <div>{label}</div>
                                            <div className="st-eventName">
                                                {cell.requiresSubject?cell.subjectName:cell.eventTypeName}
                                            </div>
                                            <div>{cell.teacherFullName}</div>
                                        </>)
                                        : canEdit
                                            ? <div className="st-plus">+</div>
                                            : null
                                    }
                                </td>
                            )
                        })}
                    </tr>
                ))}
                </tbody>
            </table>

            {/* легенда событий */}
            {eventTypes.length>0 && (
                <div className="st-legend">
                    {eventTypes.map(type=>(
                        <div key={type.id} className="st-legend-item">
                            <div className="st-legend-color" style={{backgroundColor:type.color}} />
                            <span>{type.name}</span>
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
                                {modalData.eventId? 'Редактировать событие':'Добавить событие'}
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
                        >{eventTypes.map(type=>(<option key={type.id} value={type.id}>{type.name}</option>))}</select>
                        <select
                            name="subjectId"
                            value={formData.subjectId}
                            onChange={handleFormChange}
                            className="st-select"
                            disabled={!requiresSubject}
                        >
                            <option value="">Выберите предмет</option>
                            {subjects.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
                        </select>
                        <select
                            name="teacherId"
                            value={formData.teacherId}
                            onChange={handleFormChange}
                            className="st-select"
                            disabled={!formData.subjectId}
                        >
                            <option value="">Выберите учителя</option>
                            {teachers.map(t=>(<option key={t.id} value={t.id}>{t.fullName}</option>))}
                        </select>
                        <select
                            name="schoolClassId"
                            value={formData.schoolClassId}
                            onChange={handleFormChange}
                            className="st-select"
                        >
                            <option value="">Выберите класс</option>
                            {classes.map(c=>(<option key={c.id} value={c.id}>{c.grade}{c.section}</option>))}
                        </select>
                        <div className="st-modal-footer">
                            {modalData.eventId && <button className="st-btn st-btn-delete" onClick={handleDelete}>Удалить</button>}
                            <div style={{flex:1}} />
                            <button className="st-btn" onClick={()=>setShowModal(false)}>Отмена</button>
                            <button className="st-btn" onClick={handleSubmit} disabled={!formData.teacherId}>Сохранить</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
