import React, { useState, useEffect } from 'react'
import * as UI from '../UI/SapSalesOrdersUI';
import { MagnifyingGlass, Download, Eye, FileText, Calendar, Package, User, CurrencyCircleDollar } from '@phosphor-icons/react'
import axios from 'axios'
import { format } from 'date-fns'
import { upsertSapSalesOrders, upsertSapSalesOrderItems } from '../../services/sapService'

const API_URL = 'http://localhost:3001'

// Definir cores como constantes para garantir consistência
const colors = {
  primary: '#0066cc',
  primaryDark: '#0052a3',
  primaryText: '#1a1a1a',
  secondaryText: '#666666',
  background: '#f5f5f5',
  white: '#ffffff',
  borderColor: '#e0e0e0',
  success: '#28a745',
  error: '#dc3545',
  warning: '#ffc107'
}

function SapSalesOrders() {
  const [filters, setFilters] = useState({
    customerNumber: '0000100024',
    salesOrganization: '1000',
    documentDateFrom: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
    documentDateTo: format(new Date(), 'yyyy-MM-dd')
  })

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderDetails, setOrderDetails] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    searchOrders()
  }, [])

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const searchOrders = async () => {
    if (!filters.customerNumber) {
      alert('Por favor, informe o número do cliente')
      return
    }

    const requestData = {
      CUSTOMER_NUMBER: filters.customerNumber.padStart(10, '0'),
      SALES_ORGANIZATION: filters.salesOrganization,
      DOCUMENT_DATE: filters.documentDateFrom.replace(/-/g, ''),
      DOCUMENT_DATE_TO: filters.documentDateTo.replace(/-/g, '')
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/cpi/BAPI_SALESORDER_GETLIST`, requestData)

      // Corrigido para acessar a estrutura correta da resposta
      if (response.data?.['BAPI_SALESORDER_GETLIST.Response']?.SALES_ORDERS?.item) {
        const ordersData = response.data['BAPI_SALESORDER_GETLIST.Response'].SALES_ORDERS.item
        const uniqueOrders = getUniqueOrders(ordersData)
        setOrders(uniqueOrders)

        if (uniqueOrders.length > 0) {
          await saveOrdersToDatabase(uniqueOrders)
        }
      } else {
        setOrders([])
      }
    } catch (error) {
      console.error('Erro ao buscar ordens:', error)
      alert('Erro ao buscar ordens de venda. Verifique a conexão com o SAP.')
    } finally {
      setLoading(false)
    }
  }

  const getUniqueOrders = (ordersData) => {
    const orderMap = new Map()

    ordersData.forEach(item => {
      const orderNumber = item.SD_DOC

      if (!orderMap.has(orderNumber)) {
        orderMap.set(orderNumber, {
          SD_DOC: orderNumber,
          SOLD_TO: item.SOLD_TO,
          NAME: item.NAME,
          DOC_TYPE: item.DOC_TYPE,
          DOC_DATE: item.DOC_DATE,
          CREATION_DATE: item.CREATION_DATE,
          NET_VAL_HD: item.NET_VAL_HD,
          CURRENCY: item.CURRENCY,
          DOC_STATUS: item.DOC_STATUS,
          STATUS_DOC: item.STATUS_DOC,
          SALES_ORG: item.SALES_ORG,
          DISTR_CHAN: item.DISTR_CHAN,
          DIVISION: item.DIVISION,
          PURCH_NO_C: item.PURCH_NO_C,
          items: []
        })
      }

      orderMap.get(orderNumber).items.push({
        ITM_NUMBER: item.ITM_NUMBER,
        MATERIAL: item.MATERIAL,
        MATERIAL_LONG: item.MATERIAL_LONG,
        SHORT_TEXT: item.SHORT_TEXT,
        REQ_QTY: item.REQ_QTY,
        SALES_UNIT: item.SALES_UNIT,
        NET_PRICE: item.NET_PRICE,
        NET_VALUE: item.NET_VALUE,
        REQ_DATE: item.REQ_DATE,
        PLANT: item.PLANT
      })
    })

    return Array.from(orderMap.values())
  }

  const saveOrdersToDatabase = async (sapOrders) => {
    try {
      const ordersToSave = sapOrders.map(order => ({
        sap_order_number: order.SD_DOC,
        customer_sap_id: order.SOLD_TO,
        customer_name: order.NAME,
        doc_type: order.DOC_TYPE,
        doc_date: formatSapDate(order.DOC_DATE),
        creation_date: formatSapDate(order.CREATION_DATE),
        net_value: parseFloat(order.NET_VAL_HD || 0),
        currency: order.CURRENCY || 'BRL',
        doc_status: order.DOC_STATUS,
        status_doc: order.STATUS_DOC,
        sales_org: order.SALES_ORG,
        distribution_channel: order.DISTR_CHAN,
        division: order.DIVISION,
        purchase_order: order.PURCH_NO_C,
        items_count: order.items.length,
        raw_data: order
      }))

      try {
        await upsertSapSalesOrders(ordersToSave)
      } catch (error) {
        console.error('Erro ao salvar pedidos no banco:', error)
      }

      // Salvar também os itens
      const itemsToSave = []
      sapOrders.forEach(order => {
        order.items.forEach(item => {
          itemsToSave.push({
            sap_order_number: order.SD_DOC,
            item_number: item.ITM_NUMBER,
            material: item.MATERIAL,
            material_long: item.MATERIAL_LONG,
            description: item.SHORT_TEXT,
            quantity: parseFloat(item.REQ_QTY || 0),
            sales_unit: item.SALES_UNIT,
            unit_price: parseFloat(item.NET_PRICE || 0),
            net_value: parseFloat(item.NET_VALUE || 0),
            delivery_date: formatSapDate(item.REQ_DATE),
            plant: item.PLANT
          })
        })
      })

      if (itemsToSave.length > 0) {
        try {
          await upsertSapSalesOrderItems(itemsToSave)
        } catch (error) {
          console.error('Erro ao salvar itens:', error)
        }
      }
    } catch (error) {
      console.error('Erro ao processar ordens:', error)
    }
  }

  const loadOrderDetails = (order) => {
    setOrderDetails(order)
    setSelectedOrder(order)
    setShowDetails(true)
  }

  const exportToExcel = () => {
    const headers = ['Documento', 'Cliente', 'Nome', 'Data', 'Valor Total', 'Moeda', 'Status', 'Org. Vendas']
    const data = orders.map(order => [
      order.SD_DOC,
      order.SOLD_TO,
      order.NAME,
      formatDate(order.DOC_DATE),
      formatCurrency(order.NET_VAL_HD),
      order.CURRENCY,
      getStatusLabel(order.STATUS_DOC),
      order.SALES_ORG
    ])

    const csvContent = [headers, ...data]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ordens_venda_sap_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'C': { class: 'completed', label: 'Concluído' },
      'A': { class: 'pending', label: 'Em Aberto' },
      'B': { class: 'pending', label: 'Em Processamento' },
      'Completed': { class: 'completed', label: 'Concluído' }
    }

    const mapped = statusMap[status] || { class: 'pending', label: status || 'Pendente' }
    return <UI.StatusBadge className={mapped.class}>{mapped.label}</UI.StatusBadge>
  }

  const getStatusLabel = (status) => {
    const statusMap = {
      'C': 'Concluído',
      'A': 'Em Aberto',
      'B': 'Em Processamento',
      'Completed': 'Concluído'
    }
    return statusMap[status] || status || 'Pendente'
  }

  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00'
    return `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  }

  const formatSapDate = (date) => {
    if (!date || date === '0000-00-00') return null
    if (date.length === 10 && date.includes('-')) return date
    if (date.length === 8) {
      const year = date.substring(0, 4)
      const month = date.substring(4, 6)
      const day = date.substring(6, 8)
      return `${year}-${month}-${day}`
    }
    return date
  }

  const formatDate = (date) => {
    if (!date || date === '0000-00-00') return '-'
    try {
      if (date.length === 8) {
        const year = date.substring(0, 4)
        const month = date.substring(4, 6)
        const day = date.substring(6, 8)
        return `${day}/${month}/${year}`
      }
      if (date.includes('-')) {
        const [year, month, day] = date.split('-')
        return `${day}/${month}/${year}`
      }
      return new Date(date).toLocaleDateString('pt-BR')
    } catch {
      return date
    }
  }

  return (
    <UI.Container>
      <UI.Header>
        <h1>Ordens de Venda SAP</h1>
        <p>Consulte e gerencie ordens de venda diretamente do SAP</p>
      </UI.Header>

      <UI.FiltersCard>
        <UI.FilterGrid>
          <UI.FilterGroup>
            <label>Número do Cliente</label>
            <input
              type="text"
              value={filters.customerNumber}
              onChange={(e) => handleFilterChange('customerNumber', e.target.value)}
              placeholder="Ex: 0000100024"
            />
          </UI.FilterGroup>

          <UI.FilterGroup>
            <label>Organização de Vendas</label>
            <select
              value={filters.salesOrganization}
              onChange={(e) => handleFilterChange('salesOrganization', e.target.value)}
            >
              <option value="1000">1000 - Principal</option>
              <option value="2000">2000 - Secundária</option>
            </select>
          </UI.FilterGroup>

          <UI.FilterGroup>
            <label>Data Inicial</label>
            <input
              type="date"
              value={filters.documentDateFrom}
              onChange={(e) => handleFilterChange('documentDateFrom', e.target.value)}
            />
          </UI.FilterGroup>

          <UI.FilterGroup>
            <label>Data Final</label>
            <input
              type="date"
              value={filters.documentDateTo}
              onChange={(e) => handleFilterChange('documentDateTo', e.target.value)}
            />
          </UI.FilterGroup>
        </UI.FilterGrid>

        <UI.FilterActions>
          <button className="secondary" onClick={() => {
            setFilters({
              customerNumber: '0000100024',
              salesOrganization: '1000',
              documentDateFrom: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
              documentDateTo: format(new Date(), 'yyyy-MM-dd')
            })
          }}>
            Limpar
          </button>
          <button className="primary" onClick={searchOrders} disabled={loading}>
            <MagnifyingGlass size={16} weight="bold" />
            Buscar
          </button>
        </UI.FilterActions>
      </UI.FiltersCard>

      <UI.TableCard>
        <UI.TableHeader>
          <h2>Ordens Encontradas ({orders.length})</h2>
          <div className="actions">
            {orders.length > 0 && (
              <button onClick={exportToExcel}>
                <Download size={16} />
                Exportar
              </button>
            )}
          </div>
        </UI.TableHeader>

        <UI.TableWrapper>
          {orders.length > 0 ? (
            <UI.Table>
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Cliente</th>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Data Criação</th>
                  <th>Valor Total</th>
                  <th>Moeda</th>
                  <th>Status</th>
                  <th>Org. Vendas</th>
                  <th>Itens</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={index} className={selectedOrder?.SD_DOC === order.SD_DOC ? 'selected' : ''}>
                    <td className="number">{order.SD_DOC}</td>
                    <td className="number">{order.SOLD_TO}</td>
                    <td>{order.NAME}</td>
                    <td>{order.DOC_TYPE}</td>
                    <td>{formatDate(order.CREATION_DATE)}</td>
                    <td className="currency">{formatCurrency(order.NET_VAL_HD)}</td>
                    <td>{order.CURRENCY || 'BRL'}</td>
                    <td>{getStatusBadge(order.STATUS_DOC || order.DOC_STATUS)}</td>
                    <td>{order.SALES_ORG}</td>
                    <td style={{ textAlign: 'center' }}>{order.items.length}</td>
                    <td>
                      <button
                        onClick={() => loadOrderDetails(order)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: colors.primary,
                          cursor: 'pointer',
                          padding: '4px 8px'
                        }}
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </UI.Table>
          ) : (
            <UI.EmptyState>
              <Package size={48} />
              <h3>Nenhuma ordem encontrada</h3>
              <p>Ajuste os filtros e tente novamente</p>
            </UI.EmptyState>
          )}
        </UI.TableWrapper>
      </UI.TableCard>

      {showDetails && orderDetails && (
        <UI.DetailsModal onClick={() => setShowDetails(false)}>
          <UI.ModalContent onClick={(e) => e.stopPropagation()}>
            <UI.ModalHeader>
              <h2>Detalhes da Ordem {orderDetails.SD_DOC}</h2>
              <button onClick={() => setShowDetails(false)}>×</button>
            </UI.ModalHeader>
            <UI.ModalBody>
              <UI.DetailSection>
                <h3><FileText size={20} /> Informações Gerais</h3>
                <UI.DetailGrid>
                  <UI.DetailItem>
                    <label>Número do Documento</label>
                    <div className="value">{orderDetails.SD_DOC}</div>
                  </UI.DetailItem>
                  <UI.DetailItem>
                    <label>Tipo de Documento</label>
                    <div className="value">{orderDetails.DOC_TYPE}</div>
                  </UI.DetailItem>
                  <UI.DetailItem>
                    <label>Data de Criação</label>
                    <div className="value">{formatDate(orderDetails.CREATION_DATE)}</div>
                  </UI.DetailItem>
                  <UI.DetailItem>
                    <label>Data do Documento</label>
                    <div className="value">{formatDate(orderDetails.DOC_DATE)}</div>
                  </UI.DetailItem>
                  <UI.DetailItem>
                    <label>Valor Total</label>
                    <div className="value">{formatCurrency(orderDetails.NET_VAL_HD)}</div>
                  </UI.DetailItem>
                  <UI.DetailItem>
                    <label>Moeda</label>
                    <div className="value">{orderDetails.CURRENCY || 'BRL'}</div>
                  </UI.DetailItem>
                  <UI.DetailItem>
                    <label>Status</label>
                    <div className="value">{getStatusLabel(orderDetails.STATUS_DOC || orderDetails.DOC_STATUS)}</div>
                  </UI.DetailItem>
                  <UI.DetailItem>
                    <label>Ordem de Compra</label>
                    <div className="value">{orderDetails.PURCH_NO_C || '-'}</div>
                  </UI.DetailItem>
                </UI.DetailGrid>
              </UI.DetailSection>

              <UI.DetailSection>
                <h3><User size={20} /> Dados do Cliente</h3>
                <UI.DetailGrid>
                  <UI.DetailItem>
                    <label>Código</label>
                    <div className="value">{orderDetails.SOLD_TO}</div>
                  </UI.DetailItem>
                  <UI.DetailItem>
                    <label>Nome</label>
                    <div className="value">{orderDetails.NAME}</div>
                  </UI.DetailItem>
                  <UI.DetailItem>
                    <label>Organização de Vendas</label>
                    <div className="value">{orderDetails.SALES_ORG}</div>
                  </UI.DetailItem>
                  <UI.DetailItem>
                    <label>Canal de Distribuição</label>
                    <div className="value">{orderDetails.DISTR_CHAN}</div>
                  </UI.DetailItem>
                  <UI.DetailItem>
                    <label>Divisão</label>
                    <div className="value">{orderDetails.DIVISION}</div>
                  </UI.DetailItem>
                </UI.DetailGrid>
              </UI.DetailSection>

              <UI.DetailSection>
                <h3><Package size={20} /> Itens do Pedido</h3>
                <UI.ItemsTable>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Material</th>
                      <th>Descrição</th>
                      <th>Quantidade</th>
                      <th>Unidade</th>
                      <th>Preço Unit.</th>
                      <th>Valor Total</th>
                      <th>Data Entrega</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetails.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.ITM_NUMBER}</td>
                        <td>{item.MATERIAL}</td>
                        <td>{item.SHORT_TEXT}</td>
                        <td>{parseFloat(item.REQ_QTY).toLocaleString('pt-BR')}</td>
                        <td>{item.SALES_UNIT}</td>
                        <td className="currency">{formatCurrency(item.NET_PRICE)}</td>
                        <td className="currency">{formatCurrency(item.NET_VALUE)}</td>
                        <td>{formatDate(item.REQ_DATE)}</td>
                      </tr>
                    ))}
                  </tbody>
                </UI.ItemsTable>
              </UI.DetailSection>
            </UI.ModalBody>
          </UI.ModalContent>
        </UI.DetailsModal>
      )}

      {loading && (
        <UI.LoadingOverlay>
          <div className="spinner" />
        </UI.LoadingOverlay>
      )}
    </UI.Container>
  )
}

export default SapSalesOrders
