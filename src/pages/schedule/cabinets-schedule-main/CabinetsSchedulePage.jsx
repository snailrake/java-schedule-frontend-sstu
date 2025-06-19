import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { authFetch } from '../../../apiClient.js';
import { useAuth } from '../../../components/auth/AuthContext.jsx';
import './CabinetsSchedulePage.css';

function extractFloor(number) {
    if (!number || typeof number !== 'string') return 'Другое';
    const first = number.trim()[0];
    return /^[0-9]$/.test(first) ? first : 'Другое';
}

export default function CabinetsSchedulePage() {
    const navigate = useNavigate();
    const { cabinetId } = useParams();
    const { role } = useAuth();
    const canEdit = role === 'ROLE_SCHEDULER' || role === 'ROLE_ADMIN';

    const [cabinets, setCabinets] = useState([]);
    const floorRefs = useRef({});

    useEffect(() => {
        authFetch('/api/v1/cabinets/list')
            .then(res => res.json())
            .then(data => setCabinets(data.filter(c => c.active)))
            .catch(() => {});
    }, []);

    const groupedByFloor = useMemo(() => cabinets.reduce((acc, cab) => {
        const floor = extractFloor(cab.number);
        if (!acc[floor]) acc[floor] = [];
        acc[floor].push(cab);
        return acc;
    }, {}), [cabinets]);

    const floors = useMemo(() => {
        const nums = Object.keys(groupedByFloor).filter(f => f !== 'Другое').sort((a, b) => a - b);
        return [...nums, ...(groupedByFloor['Другое'] ? ['Другое'] : [])];
    }, [groupedByFloor]);

    return (
        <div className="cabinets-page">
            {/* навигация по этажам */}
            <h1 className="cabinets-title">Расписание кабинетов</h1>
            <div className="cabinets-nav">
                {floors.map(floor => (
                    <button
                        key={floor}
                        onClick={() => floorRefs.current[floor]?.scrollIntoView({ behavior: 'smooth' })}
                        className="floor-btn"
                    >
                        {floor === 'Другое' ? 'Другое' : `Этаж ${floor}`}
                    </button>
                ))}
            </div>

            {/* секции кабинетов */}
            <div className="cabinets-container">
                {floors.map(floor => (
                    <section
                        key={floor}
                        ref={el => (floorRefs.current[floor] = el)}
                        className="cabinets-section"
                    >
                        <h2 className="cabinets-section-title">
                            {floor === 'Другое' ? 'Другое' : `Этаж ${floor}`}
                        </h2>
                        <div className="cabinets-grid">
                            {groupedByFloor[floor].map(cab => (
                                <div key={cab.id} className="cabinet-card">
                                    <button
                                        onClick={() => navigate(`/schedule-by-room/${cab.id}`)}
                                        className="cabinet-btn"
                                    >
                                        {cab.number}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
