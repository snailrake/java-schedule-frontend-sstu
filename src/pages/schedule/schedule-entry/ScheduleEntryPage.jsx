import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../components/auth/AuthContext.jsx';
import './ScheduleEntryPage.css';

export default function ScheduleEntryPage() {
    const navigate = useNavigate();
    const { role } = useAuth();

    useEffect(() => {
        if (role === 'ROLE_USER') {
            navigate('/schedule-builder');
        }
    }, [role, navigate]);

    if (role === 'ROLE_SCHEDULER' || role === 'ROLE_ADMIN') {
        return (
            <>
                {/* обёртка страницы */}
                <div className="entry-outer">

                    {/* контейнер с кнопками */}
                    <div className="entry-simple-container">
                        <h2 className="entry-simple-title">Выберите действие</h2>

                        {/* кнопки действий */}
                        <div className="entry-simple-buttons">
                            <button onClick={() => navigate('/schedule-builder')}>Составление расписания</button>
                            <button onClick={() => navigate('/event-types')}>Типы событий</button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return null;
}
