import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/navbar/NavBar.jsx';
import ScheduleEntryPage from './pages/schedule/schedule-entry/ScheduleEntryPage.jsx';
import ClassesScheduleMainPage from './pages/schedule/classes-schedule-main/ClassesScheduleMainPage.jsx';
import ScheduleTable from './pages/schedule/classes-schedule-table/ClassesScheduleTablePage.jsx';
import EventTypesPage from './pages/schedule/event-types/EventTypesPage.jsx';
import LoginPage from './pages/login/LoginPage.jsx';
import UsersPage from './pages/users/UsersPage.jsx';
import TeachersScheduleMainPage from './pages/schedule/teachers-schedule-main/TeachersScheduleMainPage.jsx';
import TeacherScheduleTablePage from './pages/schedule/teacher-schedule-table/TeacherScheduleTablePage.jsx';
import CabinetsSchedulePage from './pages/schedule/cabinets-schedule-main/CabinetsSchedulePage.jsx';
import CabinetScheduleTable from './pages/schedule/cabinet-schedule-table/CabinetScheduleTable.jsx';
import SubjectsEntryPage from './pages/subjects/subjects-entry/SubjectsEntryPage.jsx'; // 👈 добавлено
import { AuthProvider } from './components/auth/AuthContext.jsx';
import SubjectsPage from './pages/subjects/subjects-table/SubjectsPage.jsx';
import SubjectsCategoriesPage from './pages/subjects/subjects-categories/SubjectsCategoriesPage.jsx';
import CabinetsEntryPage from './pages/cabinets/cabinets-entry/CabinetsEntryPage.jsx';
import CabinetsPage from './pages/cabinets/cabinets-table/CabinetsPage.jsx';
import CabinetsTypes from './pages/cabinets/cabinets-types/CabinetsTypes.jsx';
import CabinetsStatuses from './pages/cabinets/cabinets-statuses/CabinetsStatuses.jsx';
import EquipmentsPage from './pages/equipment/equipment-table/EquipmentsPage.jsx';
import EquipmentTypesPage from './pages/equipment/equipment-types/EquipmentTypesPage.jsx';
import EquipmentStatusesPage from './pages/equipment/equipment-statuses/EquipmentStatusesPage.jsx';
import TeachersPage from './pages/teachers/teachers-table/TeachersPage.jsx';

function App() {
    return (
        <Router>
            <AuthProvider>
                <NavBar />
                <div className="pt-16">
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/" element={<ScheduleEntryPage />} />
                        <Route path="/schedule-builder" element={<ClassesScheduleMainPage />} />
                        <Route path="/schedule/:classLabel" element={<ScheduleTable />} />
                        <Route path="/event-types" element={<EventTypesPage />} />
                        <Route path="/users" element={<UsersPage />} />
                        <Route path="/teachers-schedule" element={<TeachersScheduleMainPage />} />
                        <Route path="/teachers-schedule/:teacherId" element={<TeacherScheduleTablePage />} />
                        <Route path="/schedule-by-room" element={<CabinetsSchedulePage />} />
                        <Route path="/schedule-by-room/:cabinetId" element={<CabinetScheduleTable />} />
                        <Route path="/subjects" element={<SubjectsEntryPage />} /> {/* 👈 добавлено */}
                        <Route path="/subjects-management" element={<SubjectsPage />} />
                        <Route path="/subjects-categories" element={<SubjectsCategoriesPage />} />
                        <Route path="/cabinets" element={<CabinetsEntryPage />} />
                        <Route path="/cabinets-management" element={<CabinetsPage />} />
                        <Route path="/cabinets-types" element={<CabinetsTypes />} />
                        <Route path="/cabinets-statuses" element={<CabinetsStatuses />} />
                        <Route path="/equipments-management" element={<EquipmentsPage />} />
                        <Route path="/equipments-types" element={<EquipmentTypesPage />} />
                        <Route path="/equipments-statuses" element={<EquipmentStatusesPage />} />
                        <Route path="/teachers" element={<TeachersPage />} />
                    </Routes>
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;
