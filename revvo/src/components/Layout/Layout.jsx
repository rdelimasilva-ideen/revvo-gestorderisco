import React from 'react';
import styled from 'styled-components';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import * as UI from '../UI/LayoutUI'

const Layout = ({
  children,
  currentPage,
  setCurrentPage,
  isSidebarOpen,
  setIsSidebarOpen,
  isConfigOpen,
  setIsConfigOpen,
  setShowWorkflowRules,
  setShowSalesOrder
}) => {
  const [isSalesRequestOpen, setIsSalesRequestOpen] = React.useState(false);

  // Mantenha o estado de menus pai quando mudar de página
  React.useEffect(() => {
    // Se o currentPage for um subitem de Solicitação de Limite, garanta que o menu está aberto
    if (currentPage === 'my-requests' || currentPage === 'sales-order') {
      setIsSalesRequestOpen(true);
    }
    
    // Se o currentPage for um subitem de Configurações, garanta que o menu está aberto
    if (currentPage === 'profiles' || 
        currentPage === 'company' || 
        currentPage === 'workflow' || 
        currentPage === 'credit-limit-policies') {
      setIsConfigOpen(true);
    }
  }, [currentPage, setIsSalesRequestOpen, setIsConfigOpen]);

  React.useEffect(() => {
    const handleNavigateToProfile = () => {
      setCurrentPage('profile');
    };

    window.addEventListener('navigateToProfile', handleNavigateToProfile);
    return () => {
      window.removeEventListener('navigateToProfile', handleNavigateToProfile);
    };
  }, [setCurrentPage]);

  return (
    <UI.Container>
      <TopBar />
      <UI.Content>
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isConfigOpen={isConfigOpen}
          setIsConfigOpen={setIsConfigOpen}
          isSalesRequestOpen={isSalesRequestOpen}
          setIsSalesRequestOpen={setIsSalesRequestOpen}
          setShowWorkflowRules={setShowWorkflowRules}
          setShowSalesOrder={setShowSalesOrder}
        />
        <UI.Main>
          {children}
        </UI.Main>
      </UI.Content>
    </UI.Container>
  );
};

export default Layout;
