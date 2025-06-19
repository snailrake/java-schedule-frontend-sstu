import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../components/auth/AuthContext.jsx'
import './CabinetsEntryPage.css'

export default function CabinetsEntryPage() {
    const navigate = useNavigate()
    const { role } = useAuth()

    useEffect(() => {
        if (role === 'ROLE_USER') {
            navigate('/schedule-by-room')
        }
    }, [role, navigate])

    if (role === 'ROLE_FACILITY_MANAGER' || role === 'ROLE_ADMIN') {
        return (
            // обёртка страницы
            <div className="entry-outer">
                <div className="entry-panels">

                    {/* панель кабинетов */}
                    <div className="entry-simple-container">
                        <h2 className="entry-simple-title">Кабинеты</h2>
                        <div className="entry-simple-buttons">
                            <button onClick={() => navigate('/cabinets-management')}>Управление кабинетами</button>
                            <button onClick={() => navigate('/cabinets-types')}>Типы кабинетов</button>
                            <button onClick={() => navigate('/cabinets-statuses')}>Статусы кабинетов</button>
                        </div>
                    </div>

                    {/* панель оборудования */}
                    <div className="entry-simple-container">
                        <h2 className="entry-simple-title">Оборудование</h2>
                        <div className="entry-simple-buttons">
                            <button onClick={() => navigate('/equipments-management')}>Управление оборудованием</button>
                            <button onClick={() => navigate('/equipments-types')}>Типы оборудования</button>
                            <button onClick={() => navigate('/equipments-statuses')}>Статусы оборудования</button>
                        </div>
                    </div>

                </div>
            </div>
        )
    }

    return null
}
