import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../components/auth/AuthContext.jsx';
import './SubjectsEntryPage.css';

export default function SubjectsEntryPage() {
    const navigate = useNavigate();
    const { role } = useAuth();

    useEffect(() => {
        if (role === 'ROLE_USER') {
            navigate('/subjects-management');
        }
    }, [role, navigate]);

    if (role === 'ROLE_SCHEDULER' || role === 'ROLE_ADMIN') {
        return (
            <>
                {/* обёртка страницы */}
                <div className="entry-outer">
                    {/* контейнер с выбором действия */}
                    <div className="entry-simple-container">
                        <h2 className="entry-simple-title">Выберите действие</h2>

                        {/* кнопки действий */}
                        <div className="entry-simple-buttons">
                            <button onClick={() => navigate('/subjects-management')}>Управление предметами</button>
                            <button onClick={() => navigate('/subjects-categories')}>Категории предметов</button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return null;
}
