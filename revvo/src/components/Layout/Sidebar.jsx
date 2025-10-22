import React from 'react';
import styled from 'styled-components';
import {
  House, List, CurrencyDollar, ShoppingCart, Gear, ChartLine,
  CaretDown, Question, Bell, User,
  Envelope, SignOut, Clock, Package,
  SignOutIcon, Sliders
} from '@phosphor-icons/react';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as UI from '../UI/SiderbarUI'

const Sidebar = ({
  currentPage,
  setCurrentPage,
  isSidebarOpen,
  setIsSidebarOpen,
  isConfigOpen,
  setIsConfigOpen,
  isSalesRequestOpen: propIsSalesRequestOpen,
  setIsSalesRequestOpen,
  setShowWorkflowRules,
  setShowSalesOrder
}) => {
  const navigate = useNavigate();
  // Usar React.useState para garantir que funcione mesmo se o componente não for importado como React
  const [localIsSalesRequestOpen, setLocalIsSalesRequestOpen] = React.useState(false);

  // Usar o estado local se o prop não estiver definido
  const effectiveIsSalesRequestOpen = propIsSalesRequestOpen !== undefined ? propIsSalesRequestOpen : localIsSalesRequestOpen;
  const handleSalesRequestToggle = () => {
    // Verifica se algum subitem está selecionado
    const isSalesRequestSubitemSelected = currentPage === 'my-requests' || currentPage === 'sales-order';
    
    // Só permite fechar se nenhum subitem estiver selecionado
    if (effectiveIsSalesRequestOpen && isSalesRequestSubitemSelected) {
      // Se já está aberto e um subitem está selecionado, não faz nada
      return;
    }
    
    // Caso contrário, alterna normalmente
    if (setIsSalesRequestOpen) {
      setIsSalesRequestOpen(!effectiveIsSalesRequestOpen);
    } else {
      setLocalIsSalesRequestOpen(!effectiveIsSalesRequestOpen);
    }
  };
  
  // Funções para garantir que os menus pais permaneçam abertos
  const handleSalesRequestSubitemClick = (page, showSalesOrder = false) => {
    // Primeiro garantimos que o menu de solicitação permanece aberto
    // Precisa ser executado antes de mudar a página atual
    if (setIsSalesRequestOpen) {
      setIsSalesRequestOpen(true);
    } else {
      setLocalIsSalesRequestOpen(true);
    }
    
    // Depois atualizamos a página atual e outros estados
    setCurrentPage(page);
    if (setShowSalesOrder) {
      setShowSalesOrder(showSalesOrder);
    }
  };

  const handleConfigSubitemClick = (page, showWorkflow = false) => {
    // Garante que o menu de configurações permanece aberto primeiro
    setIsConfigOpen(true);
    
    // Depois atualizamos a página atual e outros estados
    setCurrentPage(page);
    if (setShowWorkflowRules) {
      setShowWorkflowRules(showWorkflow);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Iniciando processo de logout...');
      
      // Importar a função logout do serviço de autenticação
      const { logout } = await import('../../services/authService');
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
    <>
      <UI.MenuButton onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        <List size={24} />
      </UI.MenuButton>

      <UI.SidebarContainer data-isopen={isSidebarOpen.toString()}>
        <h3>Menu</h3>
        <ul style={{ marginTop: '16px' }}>
          <li
            className={currentPage === 'sales' || currentPage === 'home' ? 'active' : ''}
            onClick={() => {
              setCurrentPage('sales');
              setShowSalesOrder(false);
            }}
          >
            <Envelope size={16} weight="regular" />
            Caixa de Entrada
          </li>
          <li onClick={handleSalesRequestToggle} style={{ cursor: 'pointer' }}>
            <ShoppingCart size={16} weight="regular" />
            Solicitação de Limite
            <CaretDown
              size={16}
              style={{
                marginLeft: '4px',
                transform: effectiveIsSalesRequestOpen ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.3s ease'
              }}
            />
          </li>
        </ul>

        <ul className="submenu" style={{ display: effectiveIsSalesRequestOpen ? 'block' : 'none' }}>
          <li
            className={currentPage === 'my-requests' ? 'active' : ''}
            onClick={() => handleSalesRequestSubitemClick('my-requests')}
          >
            Minhas solicitações
          </li>
          <li
            className={currentPage === 'sales-order' ? 'active' : ''}
            onClick={() => handleSalesRequestSubitemClick('sales-order', true)}
          >
            Nova solicitação
          </li>
        </ul>

        <ul>
          <li
            className={currentPage === 'analise' ? 'active' : ''}
            onClick={() => setCurrentPage('analise')}
          >
            <Eye size={16} weight="regular" />
            Análise do Cliente
          </li>
          <li
            className={currentPage === 'motor-regras' ? 'active' : ''}
            onClick={() => setCurrentPage('motor-regras')}
          >
            <Sliders size={16} weight="regular" />
            Motor de regras
          </li>
          <li
            className={currentPage === 'historico-limites' ? 'active' : ''}
            onClick={() => setCurrentPage('historico-limites')}
          >
            <Clock size={16} weight="regular" />
            Histórico de Limites
          </li>
          <li
            className={currentPage === 'alertas-externos' ? 'active' : ''}
            onClick={() => setCurrentPage('alertas-externos')}
          >
            <Bell size={16} weight="regular" />
            Alertas externos
          </li>
          <li
            className={currentPage === 'score-comportamental' ? 'active' : ''}
            onClick={() => setCurrentPage('score-comportamental')}
          >
            <ChartLine size={16} weight="regular" />
            Score Comportamental
          </li>
          <hr style={{ 
            margin: '12px 0', 
            borderTop: '1px solid var(--border-color)', 
            borderBottom: 'none',
            opacity: 0.5
          }} />
          <li onClick={() => {
            // Verifica se algum subitem está selecionado
            const isConfigSubitemSelected = 
              currentPage === 'profiles' || 
              currentPage === 'company' || 
              currentPage === 'workflow' || 
              currentPage === 'credit-limit-policies';
            
            // Só permite fechar se nenhum subitem estiver selecionado
            if (isConfigOpen && isConfigSubitemSelected) {
              // Se já está aberto e um subitem está selecionado, não faz nada
              return;
            }
            
            // Caso contrário, alterna normalmente
            setIsConfigOpen(!isConfigOpen);
          }} style={{ cursor: 'pointer' }}>
            <Gear size={16} weight="regular" />
            Configurações
            <CaretDown
              size={16}
              style={{
                marginLeft: '4px',
                transform: isConfigOpen ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.3s ease'
              }}
            />
          </li>
        </ul>
        <ul className="submenu" style={{ display: isConfigOpen ? 'block' : 'none' }}>
          <li
            className={currentPage === 'profiles' ? 'active' : ''}
            onClick={() => handleConfigSubitemClick('profiles')}
          >
            Perfis e acessos
          </li>
          <li
            className={currentPage === 'company' ? 'active' : ''}
            onClick={() => handleConfigSubitemClick('company')}
          >
            Dados da Empresa
          </li>
          <li
            className={currentPage === 'workflow' ? 'active' : ''}
            onClick={() => handleConfigSubitemClick('workflow', true)}
          >
            Workflow
          </li>
          <li
            className={currentPage === 'credit-limit-policies' ? 'active' : ''}
            onClick={() => handleConfigSubitemClick('credit-limit-policies')}
          >
            Políticas de limites
          </li>
        </ul>

        <ul className="mobile-menu">
          <li>
            <Question size={16} weight="regular" />
            Ajuda
          </li>
          <li>
            <Bell size={16} weight="regular" />
            Notificações
          </li>
          <li>
            <User size={16} weight="regular" />
            Perfil do usuário
          </li>
          <li onClick={handleLogout} style={{ color: '#e53e3e' }}>
            <SignOutIcon size={16} weight="regular" />
            Sair
          </li>
        </ul>

      </UI.SidebarContainer>
    </>
  );
};

export default Sidebar;
