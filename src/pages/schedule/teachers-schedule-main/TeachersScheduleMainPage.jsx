import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../../apiClient.js';
import './TeachersScheduleMainPage.css';

const letters = ['А','Б','В','Г','Д','Е','Ж','З','И','К','Л','М','Н','О','П','Р','С','Т','У','Ф','Х','Ц','Ч','Ш','Щ','Э','Ю','Я'];

export default function TeachersScheduleMainPage() {
    const navigate = useNavigate();
    const [teachers, setTeachers] = useState([]);
    const sectionRefs = useRef({});

    useEffect(() => {
        authFetch('/api/v1/teachers/list')
            .then(res => res.json())
            .then(data => setTeachers(data.filter(t => t.active)));
    }, []);

    const grouped = useMemo(() => {
        return teachers.reduce((acc, t) => {
            const initial = t.fullName[0].toUpperCase();
            if (!acc[initial]) acc[initial] = [];
            acc[initial].push(t);
            return acc;
        }, {});
    }, [teachers]);

    return (
        <div className="teachers-page">
            <h1 className="teachers-title">Расписание учителей</h1>

            {/* навигация по буквам */}
            <div className="teachers-nav">
                {letters.map(l => grouped[l] ? (
                    <button
                        key={l}
                        onClick={() => sectionRefs.current[l]?.scrollIntoView({ behavior: 'smooth' })}
                        className="letter-btn"
                    >
                        {l}
                    </button>
                ) : null)}
            </div>

            {/* секции учителей */}
            <div className="teachers-container">
                {letters.map(l => grouped[l] ? (
                    <div
                        key={l}
                        ref={el => (sectionRefs.current[l] = el)}
                        className="teachers-section"
                    >
                        <h2 className="teachers-section-title">{l}</h2>

                        {/* список учителей */}
                        <div className="teachers-grid">
                            {grouped[l].map(t => (
                                <div key={t.id} className="teacher-card">
                                    <button onClick={() => navigate(`/teachers-schedule/${t.id}`)} className="teacher-btn">
                                        {t.fullName}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null)}
            </div>
        </div>
    );
}
