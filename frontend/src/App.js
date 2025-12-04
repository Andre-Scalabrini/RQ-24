import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import Kanban from './components/kanban/Kanban';
import FichaForm from './components/ficha/FichaForm';
import FichaDetails from './components/ficha/FichaDetails';
import FichaList from './components/ficha/FichaList';
import FichasAprovadas from './components/ficha/FichasAprovadas';
import FichasReprovadas from './components/ficha/FichasReprovadas';
import UserManagement from './components/admin/UserManagement';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="kanban" element={<Kanban />} />
        <Route path="fichas" element={<FichaList />} />
        <Route path="fichas/nova" element={<FichaForm />} />
        <Route path="fichas/:id" element={<FichaDetails />} />
        <Route path="fichas/:id/editar" element={<FichaForm />} />
        <Route path="aprovadas" element={<FichasAprovadas />} />
        <Route path="reprovadas" element={<FichasReprovadas />} />
        <Route path="usuarios" element={<UserManagement />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
