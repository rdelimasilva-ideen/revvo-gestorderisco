import React, { useState, useEffect } from 'react';
import DashboardHeader from './DashboardHeader';
import DashboardFilter from './DashboardFilter';
import DashboardStats from './DashboardStats';
import DashboardOrders from './DashboardOrders';

const Dashboard = ({
  customers,
  selectedCustomer,
  setSelectedCustomer,
  isFilterOpen,
  setIsFilterOpen,
  salesOrders,
  monthlyBilling,
  orderDetails,
  selectedInvoice,
  setSelectedInvoice,
  selectedInstallment,
  setSelectedInstallment,
  selectedDetailCard,
  setSelectedDetailCard,
  handleRowClick,
  handleInstallmentClick,
  mockOrderItems,
  mockDetailData
}) => {

  return (
    <>
      <DashboardHeader />

      <DashboardFilter
        customers={customers}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
      />

      <DashboardStats
        monthlyBilling={monthlyBilling}
      />

      <DashboardOrders
        salesOrders={salesOrders}
        orderDetails={orderDetails}
        selectedInvoice={selectedInvoice}
        setSelectedInvoice={setSelectedInvoice}
        selectedInstallment={selectedInstallment}
        setSelectedInstallment={setSelectedInstallment}
        selectedDetailCard={selectedDetailCard}
        setSelectedDetailCard={setSelectedDetailCard}
        handleRowClick={handleRowClick}
        handleInstallmentClick={handleInstallmentClick}
        mockOrderItems={mockOrderItems}
        mockDetailData={mockDetailData}
      />

    </>
  );
};

export default Dashboard;
