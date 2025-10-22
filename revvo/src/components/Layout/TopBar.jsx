import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Question, Bell, User, SignOut } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { getWorkflowNotifications } from '../../services/notificationService';
import { getUserName } from '../../services/userProfileService';
import { logout } from '../../services/authService';
import { getSession } from '../../services/sessionService';
import * as UI from '../UI/TopBarUI'

const TopBar = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const menuRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoadingNotifications(true);
        // Substituindo a chamada direta ao Supabase pelo nosso serviço de sessão
        const { data: { session } } = await getSession();
        if (!session?.user?.id) return;
        const notifications = await getWorkflowNotifications(session.user.id);
        setNotifications(notifications);
        setNotificationsLoaded(true);
      } catch (error) {
        console.error('Erro ao buscar notificações:', error.message);
      } finally {
        setLoadingNotifications(false);
      }
    }
    
    if (!notificationsLoaded && !loadingNotifications) {
      fetchNotifications();
    }
  }, []); // Array vazio para executar apenas uma vez

  useEffect(() => {
    async function loadUserProfile() {
      try {
        // Substituindo a chamada direta ao Supabase pelo nosso serviço de sessão
        const { data: { session } } = await getSession();
        if (!session?.user?.id) return;
        const name = await getUserName(session.user.id);
        setCurrentUser({ name });
      } catch (error) {
        console.error('Error loading user profile:', error.message);
      }
    }
    loadUserProfile();
  }, []);
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Função para forçar reload das notificações (usar apenas quando necessário)
  const forceReloadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      // Substituindo a chamada direta ao Supabase pelo nosso serviço de sessão
      const { data: { session } } = await getSession();
      if (!session?.user?.id) return;
      const notifications = await getWorkflowNotifications(session.user.id);
      setNotifications(notifications);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error.message);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleNotificationClick = (notification) => {
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, unread: false } : n)
    );

    setShowNotifications(false);

    if (notification && notification.request) {
      window.dispatchEvent(new CustomEvent('navigateToDashboard', {
        detail: {
          order: notification.request
        }
      }));
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, unread: false }))
    );
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleLogout = async () => {
    try {
      console.log('Iniciando processo de logout do TopBar...');
      
      // Primeiro chama o logout do serviço de autenticação para limpar localStorage
      await logout();
      
      // Verificação adicional - garantir que as chaves principais foram removidas
      localStorage.removeItem('sap_token');
      localStorage.removeItem('user_info');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('session');
      
      // Forçar o recarregamento da página para limpar todos os estados
      console.log('Logout realizado, redirecionando...');
      
      // Forçar um recarregamento completo da página imediatamente
      console.log('Forçando recarregamento completo da página para o login...');
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Em caso de erro, tenta limpar o localStorage manualmente
      try {
        localStorage.clear();
      } catch (e) {
        console.error('Falha ao limpar localStorage:', e);
      }
      // Em caso de erro, força recarregar a página para o login
      window.location.href = '/login';
    }
  };

  return (
    <UI.TopHeader>
      <UI.Logo src="https://vpnusoaiqtuqihkstgzt.supabase.co/storage/v1/object/public/erp//sap-logo.png" alt="SAP" />
      <UI.HeaderRight>
        <div className="powered-by">
          Powered by
          <img src="https://vpnusoaiqtuqihkstgzt.supabase.co/storage/v1/object/public/revvo/logo/LOGO_REVVO_COLOR.png" alt="revvo" />
        </div>        <div className="icons">
          <button>
            <Question size={20} weight="regular" />
          </button>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ position: 'relative' }}
          >
            <Bell size={20} weight="regular" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <User size={20} weight="regular" />
            {currentUser?.name && (
              <span style={{ fontSize: '14px' }}>{currentUser.name}</span>
            )}
          </button>
        </div>        {showUserMenu && (
          <UI.UserMenu ref={menuRef}>
            <UI.MenuItem onClick={() => {
              setShowUserMenu(false);
              window.dispatchEvent(new CustomEvent('navigateToProfile'));
            }}>
              <User size={16} />
              Meu Perfil
            </UI.MenuItem>
            <UI.MenuItem onClick={handleLogout}>
              <SignOut size={16} />
              Sair
            </UI.MenuItem>
          </UI.UserMenu>
        )}
        {showNotifications && (
          <UI.NotificationDropdown ref={notificationRef}>            <UI.NotificationHeader>
              <h3>Notificações</h3>
              {unreadCount > 0 && (
                <button
                  className="mark-all-read"
                  onClick={handleMarkAllAsRead}
                >
                  Marcar todas como lidas
                </button>
              )}
            </UI.NotificationHeader>            <UI.NotificationList>
              {loadingNotifications ? (
                <UI.EmptyNotifications>
                  <div className="empty-text">Carregando notificações...</div>
                </UI.EmptyNotifications>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <UI.NotificationItem
                    key={notification.id}
                    className={notification.unread ? 'unread' : ''}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{notification.time}</div>
                  </UI.NotificationItem>
                ))
              ) : (
                <UI.EmptyNotifications>
                  <div className="empty-icon">
                    <Bell size={24} />
                  </div>
                  <div className="empty-text">Nenhuma notificação</div>
                </UI.EmptyNotifications>
              )}
            </UI.NotificationList>
          </UI.NotificationDropdown>
        )}
      </UI.HeaderRight>
    </UI.TopHeader>
  );
};

export default TopBar;
