import React, { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { authFetch } from '../../apiClient.js'
import './SubjectSelectModal.css'

export default function SubjectSelectModal({ selected, onApply, onCancel }) {
    const [subjects, setSubjects] = useState([])
    const [search, setSearch] = useState('')
    const [sel, setSel] = useState(selected)

    useEffect(() => {
        authFetch('/api/v1/subjects/list')
            .then(res => res.json())
            .then(setSubjects)
    }, [])

    const filtered = useMemo(() => {
        if (!search.trim()) return subjects
        return subjects.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase())
        )
    }, [subjects, search])

    const toggle = id => {
        if (sel.includes(id)) {
            setSel(sel.filter(x => x !== id))
        } else {
            setSel([...sel, id])
        }
    }

    return (
        // модалка
        <div className="st-modal-overlay" onClick={onCancel}>
            <div className="st-modal" onClick={e => e.stopPropagation()}>

                {/* кнопка закрытия */}
                <button className="st-modal-close-btn" onClick={onCancel}><X size={16} /></button>

                {/* поиск и список предметов */}
                <input
                    type="text"
                    className="st-input"
                    placeholder="Поиск"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <ul className="st-list">
                    {filtered.map(s => (
                        <li key={s.id}>
                            <label className="st-checkbox-row">
                                <input type="checkbox" checked={sel.includes(s.id)} onChange={() => toggle(s.id)} />
                                <span>{s.name} ({s.code})</span>
                            </label>
                        </li>
                    ))}
                </ul>

                {/* кнопки действий */}
                <div className="st-modal-footer">
                    <button type="button" className="st-btn" onClick={onCancel}>Отмена</button>
                    <button type="button" className="st-btn" onClick={() => onApply(sel)}>Применить</button>
                </div>

            </div>
        </div>
    )
}
