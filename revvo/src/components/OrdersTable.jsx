import React, { useState } from 'react';
import * as UI from './UI/OrdersTableUI';
import { X } from '@phosphor-icons/react';

const OrdersTable = ({ orders, customerName }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleRowClick = (order) => {
    setSelectedOrder(selectedOrder?.id === order.id ? null : order);
  };

  return (
    <div className="card">
      <h3>Pedidos</h3>
      <UI.TableWrapper>
        <table style={{ minWidth: '600px' }}>
          <thead>
            <tr>
              <th>Nº Pedido</th>
              <th>Cliente</th>
              <th>Data do pedido</th>
              <th>Valor do pedido</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <React.Fragment key={order.id}>
                <tr onClick={() => handleRowClick(order)} style={{ cursor: 'pointer' }}>
                  <td>#{order.id}</td>
                  <td>{customerName || order.customer?.name || 'N/A'}</td>
                  <td>{new Date(order.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>R$ {Number(order.total_amt).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>{order.status || 'N/A'}</td>
                </tr>
                {selectedOrder?.id === order.id && (
                  <tr style={{ background: 'transparent' }}>
                    <td colSpan={5} style={{ padding: 0, border: 0 }}>
                      <UI.InvoiceDetails>
                        <UI.InvoiceHeader>
                          <h2>Detalhes do Pedido</h2>
                          <div className="actions">
                            <button onClick={() => setSelectedOrder(null)}>
                              <X size={16} />
                            </button>
                          </div>
                        </UI.InvoiceHeader>

                        <UI.InvoiceGrid style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <UI.InvoiceField>
                            <h4>Valor total</h4>
                            <p>R$ {Number(order.total_amt).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </UI.InvoiceField>
                          <UI.InvoiceField>
                            <h4>Cliente</h4>
                            <p>{customerName || order.customer?.name || 'N/A'}</p>
                          </UI.InvoiceField>
                          <UI.InvoiceField>
                            <h4>Data do pedido</h4>
                            <p>{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                          </UI.InvoiceField>
                        </UI.InvoiceGrid>

                        {order.invoices && order.invoices.length > 0 && (
                          <UI.InstallmentsTable style={{ margin: '16px' }}>
                            <thead>
                              <tr>
                                <th>Nº Parcela</th>
                                <th>Vencimento</th>
                                <th>Valor</th>
                                <th>Status</th>
                                <th>Item</th>
                              </tr>
                            </thead>
                            <tbody style={{ background: 'white' }}>
                              {order.invoices.map((invoice, index) => (
                                <tr key={`${invoice.numero_fatura}-${index}`}>
                                  <td>{invoice.num_parcela}</td>
                                  <td>{new Date(invoice.vencimento_parcela).toLocaleDateString('pt-BR')}</td>
                                  <td>R$ {Number(invoice.item_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                  <td>{invoice.status_fatura}</td>
                                  <td>{invoice.item_nome}</td>
                                </tr>
                              ))}
                            </tbody>
                          </UI.InstallmentsTable>
                        )}
                      </UI.InvoiceDetails>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </UI.TableWrapper>
    </div>
  );
};

export default OrdersTable;