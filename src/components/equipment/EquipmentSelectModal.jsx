import React, { useState, useEffect, useMemo, useRef } from 'react'
import { X } from 'lucide-react'
import { authFetch } from '../../apiClient.js'
import './EquipmentSelectModal.css'

export default function EquipmentSelectModal({
                                                 cabinetId,
                                                 selected = [],
                                                 onApply,
                                                 onCancel
                                             }) {
    const [list, setList] = useState([])
    const [search, setSearch] = useState('')
    const [local, setLocal] = useState(selected)
    const [page, setPage] = useState(0)
    const [size, setSize] = useState(10)
    const [totalPages, setTotalPages] = useState(0)

    const initialQty = useRef(new Map())

    useEffect(() => {
        initialQty.current = new Map(
            selected.map(e => [e.equipmentId, e.quantity])
        )
        setLocal(selected)
    }, [selected])

    const fetchList = () => {
        Promise.all([
            authFetch(`/api/v1/equipments/available?page=${page}&size=${size}`)
                .then(res => res.json()),
            cabinetId
                ? authFetch(`/api/v1/equipments/list?cabinetId=${cabinetId}`)
                    .then(res => res.json())
                : Promise.resolve([])
        ]).then(([availPage, assigned]) => {
            const availList = availPage.content
            const assignedIds = assigned.map(a => a.id)

            const assignedWithFlag = assigned.map(a => ({
                ...a,
                equipmentId: a.id,
                equipmentName: a.name,
                availableQuantity: availList.find(x => x.id === a.id)?.availableQuantity ?? 0,
                isAssigned: true
            }))

            const newOnes = availList
                .filter(e => !assignedIds.includes(e.id))
                .map(e => ({
                    ...e,
                    equipmentId: e.id,
                    equipmentName: e.name,
                    isAssigned: false
                }))

            setList([...assignedWithFlag, ...newOnes])
            setTotalPages(availPage.totalPages)
        })
    }

    useEffect(fetchList, [page, size, cabinetId])

    const filtered = useMemo(() => {
        if (!search.trim()) return list
        return list.filter(e =>
            e.name.toLowerCase().includes(search.toLowerCase())
        )
    }, [list, search])

    const toggle = eq => {
        const exists = local.find(e => e.equipmentId === eq.equipmentId)
        if (exists) {
            setLocal(local.filter(e => e.equipmentId !== eq.equipmentId))
        } else {
            if ((eq.availableQuantity ?? 0) < 1) return
            setLocal([
                ...local,
                { equipmentId: eq.equipmentId, equipmentName: eq.name, quantity: 1 }
            ])
        }
    }

    const changeQty = (id, delta) => {
        setLocal(prev =>
            prev.map(e => {
                if (e.equipmentId === id) {
                    const eq = list.find(l => l.equipmentId === id)
                    const was = initialQty.current.get(id) ?? 0
                    const maxQty = eq.isAssigned
                        ? was + (eq.availableQuantity ?? 0)
                        : eq.availableQuantity ?? 0
                    const newQty = Math.min(Math.max(e.quantity + delta, 1), maxQty)
                    return { ...e, quantity: newQty }
                }
                return e
            })
        )
    }

    return (
        // модалка
        <div className="equip-modal-overlay" onClick={onCancel}>
            <div className="equip-modal" onClick={e => e.stopPropagation()}>
                <button className="equip-close-btn" onClick={onCancel}><X size={16} /></button>

                {/* заголовок и поиск */}
                <h2>Выбор оборудования</h2>
                <input type="text" placeholder="Поиск" value={search} onChange={e => setSearch(e.target.value)} />

                {/* таблица оборудования */}
                <table>
                    <thead>
                    <tr>
                        <th />
                        <th>Тип</th>
                        <th>Наименование</th>
                        <th>Бренд</th>
                        <th>Модель</th>
                        <th>Серийный №</th>
                        <th>Всего</th>
                        <th>Статус</th>
                        <th>Активен</th>
                        <th>Доступно</th>
                        <th>Кол-во</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.map(eq => {
                        const sel = local.find(e => e.equipmentId === eq.equipmentId)
                        return (
                            <tr key={eq.equipmentId}>
                                <td><input type="checkbox" checked={!!sel} onChange={() => toggle(eq)} /></td>
                                <td>{eq.typeName}</td>
                                <td>{eq.name}</td>
                                <td>{eq.brand}</td>
                                <td>{eq.model}</td>
                                <td>{eq.serialNumber}</td>
                                <td>{eq.quantity}</td>
                                <td>{eq.statusName}</td>
                                <td>{eq.active ? 'Да' : 'Нет'}</td>
                                <td>{eq.availableQuantity}</td>
                                <td>
                                    {sel && (
                                        <>
                                            <button type="button" disabled={sel.quantity <= 1} onClick={() => changeQty(eq.equipmentId, -1)}>–</button>
                                            {sel.quantity}
                                            <button
                                                type="button"
                                                disabled={
                                                    sel.quantity >= (
                                                        eq.isAssigned
                                                            ? (initialQty.current.get(eq.equipmentId) ?? 0) + (eq.availableQuantity ?? 0)
                                                            : eq.availableQuantity ?? 0
                                                    )
                                                }
                                                onClick={() => changeQty(eq.equipmentId, 1)}
                                            >
                                                +
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>

                {/* пагинация */}
                <div className="pagination">
                    <button onClick={() => setPage(p => p - 1)} disabled={page === 0}>← Назад</button>
                    <span>Страница {page + 1} из {totalPages}</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={page + 1 >= totalPages}>Вперед →</button>
                </div>

                {/* действия */}
                <div className="equip-modal-actions">
                    <button onClick={onCancel}>Отмена</button>
                    <button onClick={() => onApply(local)}>Применить</button>
                </div>
            </div>
        </div>
    )
}
