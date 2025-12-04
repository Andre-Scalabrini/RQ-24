import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Users, 
  Bell, 
  LogOut, 
  User,
  Factory,
  ChevronDown,
  Kanban,
  CheckCircle,
  XCircle
} from 'lucide-react';

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const [notifResponse, countResponse] = await Promise.all([
        api.get('/notificacoes?lida=false'),
        api.get('/notificacoes/nao-lidas')
      ]);
      setNotifications(notifResponse.data);
      setUnreadCount(countResponse.data.count);
    } catch {
      // Silently fail
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notificacoes/${id}/lida`);
      loadNotifications();
    } catch {
      // Silently fail
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notificacoes/marcar-todas-lidas');
      loadNotifications();
    } catch {
      // Silently fail
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Factory size={24} color="#2563eb" />
            <h1>RQ-24</h1>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => isActive && location.pathname === '/' ? 'active' : ''}>
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          <NavLink to="/kanban" className={({ isActive }) => isActive ? 'active' : ''}>
            <Kanban size={20} />
            Kanban
          </NavLink>
          <NavLink to="/fichas" className={({ isActive }) => isActive && !location.pathname.includes('/nova') ? 'active' : ''}>
            <FileText size={20} />
            Fichas
          </NavLink>
          <NavLink to="/fichas/nova" className={({ isActive }) => isActive ? 'active' : ''}>
            <PlusCircle size={20} />
            Nova Ficha
          </NavLink>
          <NavLink to="/aprovadas" className={({ isActive }) => isActive ? 'active' : ''}>
            <CheckCircle size={20} />
            Aprovadas
          </NavLink>
          <NavLink to="/reprovadas" className={({ isActive }) => isActive ? 'active' : ''}>
            <XCircle size={20} />
            Reprovadas
          </NavLink>
          {isAdmin() && (
            <NavLink to="/usuarios" className={({ isActive }) => isActive ? 'active' : ''}>
              <Users size={20} />
              Usuários
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Logado como:
          </div>
          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
            {user?.nome}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {user?.setor?.nome || user?.grupo}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <h2>
            {location.pathname === '/' && 'Dashboard'}
            {location.pathname === '/kanban' && 'Quadro Kanban'}
            {location.pathname === '/fichas' && 'Lista de Fichas'}
            {location.pathname === '/fichas/nova' && 'Nova Ficha'}
            {location.pathname.includes('/editar') && 'Editar Ficha'}
            {location.pathname === '/aprovadas' && 'Fichas Aprovadas'}
            {location.pathname === '/reprovadas' && 'Fichas Reprovadas'}
            {location.pathname === '/usuarios' && 'Gerenciamento de Usuários'}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="notification-bell" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
              
              {showNotifications && (
                <div className="notification-dropdown" onClick={(e) => e.stopPropagation()}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Notificações</strong>
                    {unreadCount > 0 && (
                      <button className="btn btn-sm btn-outline" onClick={markAllAsRead}>
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                      Nenhuma notificação
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`notification-item ${!notif.lida ? 'unread' : ''}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="notification-title">{notif.titulo}</div>
                        <div className="notification-message">{notif.mensagem}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="user-menu">
              <button className="user-button" onClick={() => setShowUserMenu(!showUserMenu)}>
                <User size={20} />
                <span>{user?.nome}</span>
                <ChevronDown size={16} />
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
                  <button onClick={logout}>
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
