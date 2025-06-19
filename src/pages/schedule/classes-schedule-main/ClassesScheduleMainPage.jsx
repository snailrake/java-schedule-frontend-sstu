import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { authFetch } from '../../../apiClient.js'
import './ClassesScheduleMainPage.css'

export default function ClassesScheduleMainPage() {
    const navigate = useNavigate()
    const [classes, setClasses] = useState([])
    const [allClasses, setAllClasses] = useState([])
    const [expanded, setExpanded] = useState({})

    useEffect(() => {
        authFetch('/api/v1/classes')
            .then(res => res.json())
            .then(data => {
                setClasses(data.filter(c => c.active))
                setAllClasses(data)
            })
            .catch(() => {
                setClasses([])
                setAllClasses([])
            })
    }, [])

    const grouped = useMemo(() => {
        return classes.reduce((acc, c) => {
            if (!acc[c.grade]) acc[c.grade] = []
            acc[c.grade].push(c)
            return acc
        }, {})
    }, [classes])

    const rus = ['А','Б','В','Г','Д','Е','Ё','Ж','З','И','Й','К','Л','М','Н','О','П','Р','С','Т','У','Ф','Х','Ц','Ч','Ш','Щ','Ъ','Ы','Ь','Э','Ю','Я']

    const addSection = grade => {
        const sections = grouped[grade]?.map(c => c.section) || []
        const maxIdx = sections.length ? Math.max(...sections.map(l => rus.indexOf(l))) : -1
        const next = rus[(maxIdx + 1) % rus.length]
        authFetch('/api/v1/classes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grade, section: next, active: true })
        })
            .then(res => res.json())
            .then(newC => setClasses(prev => [...prev, newC]))
    }

    const remove = (grade, id) => {
        const total = classes.filter(c => c.grade === grade).length
        if (total <= 1) {
            alert('Нельзя удалить последний класс в группе')
            return
        }
        authFetch(`/api/v1/classes/${id}`, { method: 'DELETE' })
            .then(() => setClasses(prev => prev.filter(c => c.id !== id)))
    }

    const restore = (grade, letter) => {
        authFetch('/api/v1/classes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grade, section: letter, active: true })
        })
            .then(res => res.json())
            .then(newDto => setClasses(prev => [...prev, newDto]))
    }

    const toggleExpanded = grade => {
        setExpanded(prev => ({ ...prev, [grade]: !prev[grade] }))
    }

    return (
        <div className="schedule-container">
            <div className="schedule-wrapper">
                {/* заголовок страницы */}
                <h2 className="schedule-title">Расписание занятий</h2>
                <p className="schedule-date">
                    Сегодня, {new Date().toLocaleDateString('ru-RU')}
                </p>

                {/* таблица классов */}
                <table className="schedule-table">
                    <thead>
                    <tr>
                        <th className="schedule-head">По классам</th>
                    </tr>
                    </thead>
                    <tbody>
                    {Object.entries(grouped)
                        .sort((a, b) => a[0] - b[0])
                        .map(([grade, list]) => {
                            const maxIdx = list.length
                                ? Math.max(...list.map(s => rus.indexOf(s.section)))
                                : -1
                            const grid = rus.slice(0, maxIdx + 2)
                            return (
                                <React.Fragment key={grade}>
                                    <tr>
                                        <td
                                            onClick={() => toggleExpanded(grade)}
                                            className="grade-header"
                                        >
                                            {grade} класс
                                        </td>
                                    </tr>
                                    {expanded[grade] && (
                                        <tr>
                                            <td className="grade-body">
                                                <div className="section-grid">
                                                    {grid.map(rusLetter => {
                                                        const existing = list.find(
                                                            s => s.section === rusLetter
                                                        )
                                                        const full = `${grade}${rusLetter}`
                                                        return existing ? (
                                                            <div
                                                                key={rusLetter}
                                                                onClick={() => navigate(`/schedule/${full}`)}
                                                                className="section-card"
                                                            >
                                                                {full}
                                                                <Trash2
                                                                    size={12}
                                                                    className="delete-icon"
                                                                    onClick={e => {
                                                                        e.stopPropagation()
                                                                        remove(Number(grade), existing.id)
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div
                                                                key={rusLetter}
                                                                onClick={() => restore(Number(grade), rusLetter)}
                                                                className="section-card-empty"
                                                            >
                                                                <Plus size={16} />
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )
                        })}
                    </tbody>
                </table>

                {/* навигация для сотрудников */}
                <div className="staff-panel">
                    <div className="staff-header">Для сотрудников</div>
                    <div className="staff-buttons">
                        <button onClick={() => navigate('/teachers-schedule')}>
                            По преподавателям
                        </button>
                        <button onClick={() => navigate('/schedule-by-room')}>
                            По кабинетам
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
