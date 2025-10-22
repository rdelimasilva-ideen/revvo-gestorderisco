import React, { useState, useEffect } from 'react'
import { MagnifyingGlass, Download, Eye, FileText, Calendar, Receipt, User, CurrencyCircleDollar, Bank, Hash } from '@phosphor-icons/react'
import { InvoiceService } from '../../services/invoiceService'
import * as UI from '../UI/SapInvoicesUI'

// Importa cores do estilo
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

function SapInvoices() {
  const [filters, setFilters] = useState({
    partnerNumber: '0000100003',
    companyCode: '1000'
  })

  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [invoiceDetails, setInvoiceDetails] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [goToPage, setGoToPage] = useState('')

  useEffect(() => {
    searchInvoices()
  }, [])

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const searchInvoices = async () => {
    if (!filters.partnerNumber) {
      alert('Por favor, informe o número do cliente')
      return
    }

    setLoading(true)
    try {
      const processedInvoices = await InvoiceService.getInvoices(
        filters.partnerNumber, 
        filters.companyCode
      );
      
      setInvoices(processedInvoices)
      setCurrentPage(1)
    } catch (error) {
      console.error('Erro ao buscar faturas:', error)
      alert(error.message || 'Erro ao buscar faturas. Verifique a conexão com o SAP.')
    } finally {
      setLoading(false)
    }
  }

  const loadInvoiceDetails = async (invoice) => {
    setLoading(true)
    try {
      // Usar o serviço para carregar detalhes
      const details = await InvoiceService.loadInvoiceDetails(invoice, filters.companyCode);
      
      setInvoiceDetails(details);
      setSelectedInvoice(invoice);
      setShowDetails(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes da fatura:', error)
      alert('Erro ao carregar detalhes da fatura')
    } finally {
      setLoading(false)
    }
  }

  // Função para formatar uma data do SAP - referência ao método do serviço
  const formatSapDate = (date) => {
    return InvoiceService.formatSapDate(date);
  }

  // Função para formatar valores monetários
  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00'
    const numValue = typeof value === 'string' ? parseFloat(value.trim()) : value
    return `R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Função para formatar datas
  const formatDate = (date) => {
    if (!date || date === '00000000') return '-'
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

  // Função para calcular dias em atraso
  const calculateDaysOverdue = (dueDate) => {
    if (!dueDate || dueDate === '00000000') return 0
    const due = new Date(InvoiceService.formatSapDate(dueDate))
    const today = new Date()
    const diffTime = today - due
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  // Função para formatar CNPJ
  const formatCNPJ = (cnpj) => {
    if (!cnpj) return '-'
    const cleaned = cnpj.replace(/\D/g, '')
    if (cleaned.length !== 14) return cnpj
    return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }

  // Função para obter o status de pagamento
  const getPaymentStatus = (dueDate) => {
    if (!dueDate || dueDate === '00000000') return { class: 'pending', label: 'Pendente' }

    const today = new Date()
    const due = new Date(formatSapDate(dueDate))

    if (today > due) {
      return { class: 'overdue', label: 'Vencido' }
    }

    return { class: 'pending', label: 'Em Aberto' }
  }

  // Função para exportar faturas para Excel (CSV)
  const exportToExcel = () => {
    const headers = ['Documento', 'Cliente', 'Data Faturamento', 'Vencimento', 'Valor Líquido', 'Condição Pagamento', 'NFe']
    const data = invoices.map(invoice => [
      invoice.BILLINGDOC,
      invoice.PAYER,
      formatDate(invoice.BILL_DATE),
      formatDate(invoice.NET_DATE),
      formatCurrency(invoice.NET_VALUE),
      invoice.PMNTTRMS,
      invoice.NRO_NFE || '-'
    ])

    const csvContent = [headers, ...data]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const currentDate = new Date()
    const dateStr = currentDate.getFullYear() +
                   String(currentDate.getMonth() + 1).padStart(2, '0') +
                   String(currentDate.getDate()).padStart(2, '0') + '_' +
                   String(currentDate.getHours()).padStart(2, '0') +
                   String(currentDate.getMinutes()).padStart(2, '0') +
                   String(currentDate.getSeconds()).padStart(2, '0')
    a.download = `faturas_sap_${dateStr}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }


  // Cálculos de paginação
  const totalPages = Math.ceil(invoices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentInvoices = invoices.slice(startIndex, endIndex)

  // Funções de controle de paginação
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      setGoToPage('')
    }
  }

  const handleGoToPage = () => {
    const page = parseInt(goToPage)
    if (!isNaN(page)) {
      handlePageChange(page)
    }
  }

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value))
    setCurrentPage(1)
  }

  // Cálculo dos números de página para exibição
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        if (!pages.includes(i)) {
          pages.push(i)
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <UI.Container>
      <UI.Header>
        <h1>Faturas SAP</h1>
        <p>Consulte e gerencie faturas diretamente do SAP</p>
      </UI.Header>

      <UI.FiltersCard>
        <UI.FilterGrid>
          <UI.FilterGroup>
            <label>Número do Cliente</label>
            <input
              type="text"
              value={filters.partnerNumber}
              onChange={(e) => handleFilterChange('partnerNumber', e.target.value)}
              placeholder="Ex: 0000100003"
            />
          </UI.FilterGroup>

          <UI.FilterGroup>
            <label>Código da Empresa</label>
            <select
              value={filters.companyCode}
              onChange={(e) => handleFilterChange('companyCode', e.target.value)}
            >
              <option value="1000">1000 - Principal</option>
              <option value="2000">2000 - Filial</option>
              <option value="3000">3000 - Filial 2</option>
              <option value="4000">4000 - Filial 3</option>
            </select>
          </UI.FilterGroup>
        </UI.FilterGrid>

        <UI.FilterActions>
          <button className="secondary" onClick={() => {
            setFilters({
              partnerNumber: '0000100003',
              companyCode: '1000'
            })
          }}>
            Limpar
          </button>
          <button className="primary" onClick={searchInvoices} disabled={loading}>
            <MagnifyingGlass size={16} weight="bold" />
            Buscar
          </button>
        </UI.FilterActions>
      </UI.FiltersCard>

      <UI.TableCard>
        <UI.TableHeader>
          <h2>Faturas Encontradas ({invoices.length})</h2>
          <div className="actions">
            {invoices.length > 0 && (
              <button onClick={exportToExcel}>
                <Download size={16} />
                Exportar
              </button>
            )}
          </div>
        </UI.TableHeader>

        <UI.TableWrapper>
          {invoices.length > 0 ? (
            <UI.Table>
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Cliente</th>
                  <th>Data Faturamento</th>
                  <th>Vencimento</th>
                  <th>Dias Atraso</th>
                  <th>Valor Líquido</th>
                  <th>Condição Pagamento</th>
                  <th>NFe</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {currentInvoices.map((invoice, index) => {
                  const status = getPaymentStatus(invoice.NET_DATE)
                  const daysOverdue = calculateDaysOverdue(invoice.NET_DATE)

                  return (
                    <tr key={startIndex + index} className={selectedInvoice?.BILLINGDOC === invoice.BILLINGDOC ? 'selected' : ''}>
                      <td className="number">{invoice.BILLINGDOC}</td>
                      <td className="number">{invoice.PAYER}</td>
                      <td>{formatDate(invoice.BILL_DATE)}</td>
                      <td>{formatDate(invoice.NET_DATE)}</td>
                      <td style={{
                        textAlign: 'center',
                        color: daysOverdue > 0 ? colors.error : colors.primaryText
                      }}>
                        {daysOverdue > 0 ? daysOverdue : '-'}
                      </td>
                      <td className="currency">{formatCurrency(invoice.NET_VALUE)}</td>
                      <td>{invoice.PMNTTRMS}</td>
                      <td style={{ fontSize: '12px' }}>{invoice.NRO_NFE ? invoice.NRO_NFE.substring(0, 20) + '...' : '-'}</td>
                      <td>
                        <UI.StatusBadge className={status.class}>{status.label}</UI.StatusBadge>
                      </td>
                      <td>
                        <button
                          onClick={() => loadInvoiceDetails(invoice)}
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
                  )
                })}
              </tbody>
            </UI.Table>
          ) : (
            <UI.EmptyState>
              <Receipt size={48} />
              <h3>Nenhuma fatura encontrada</h3>
              <p>Ajuste os filtros e tente novamente</p>
            </UI.EmptyState>
          )}
        </UI.TableWrapper>

        {invoices.length > 0 && (
          <UI.PaginationContainer>
            <UI.PaginationInfo>
              Mostrando <strong>{startIndex + 1}</strong> a <strong>{Math.min(endIndex, invoices.length)}</strong> de <strong>{invoices.length}</strong> faturas
            </UI.PaginationInfo>

            <UI.PaginationControls>
              <UI.PageSizeSelector
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                title="Itens por página"
              >
                <option value="10">10 por página</option>
                <option value="20">20 por página</option>
                <option value="50">50 por página</option>
                <option value="100">100 por página</option>
              </UI.PageSizeSelector>

              <UI.Divider />

              <UI.PageButton
                className="arrow"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                title="Primeira página"
              >
                ⟨⟨
              </UI.PageButton>

              <UI.PageButton
                className="arrow"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                title="Página anterior"
              >
                ⟨
              </UI.PageButton>

              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} style={{
                    padding: '0 8px',
                    color: colors.secondaryText,
                    fontSize: '14px',
                    userSelect: 'none'
                  }}>•••</span>
                ) : (
                  <UI.PageButton
                    key={page}
                    className={currentPage === page ? 'active' : ''}
                    onClick={() => handlePageChange(page)}
                    title={`Página ${page}`}
                  >
                    {page}
                  </UI.PageButton>
                )
              ))}

              <UI.PageButton
                className="arrow"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                title="Próxima página"
              >
                ⟩
              </UI.PageButton>

              <UI.PageButton
                className="arrow"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                title="Última página"
              >
                ⟩⟩
              </UI.PageButton>

              <UI.Divider />

              <UI.GoToPageContainer>
                <span>Ir para:</span>
                <UI.PageInput
                  type="number"
                  value={goToPage}
                  onChange={(e) => setGoToPage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGoToPage()}
                  onBlur={handleGoToPage}
                  min="1"
                  max={totalPages}
                  placeholder="Pág"
                />
              </UI.GoToPageContainer>
            </UI.PaginationControls>
          </UI.PaginationContainer>
        )}
      </UI.TableCard>

      {showDetails && invoiceDetails && (
        <UI.DetailsModal onClick={() => setShowDetails(false)}>
          <UI.ModalContent onClick={(e) => e.stopPropagation()}>
            <UI.ModalHeader>
              <h2>Detalhes da Fatura {invoiceDetails.BILLINGDOC}</h2>
              <button onClick={() => setShowDetails(false)}>×</button>
            </UI.ModalHeader>
            <UI.ModalBody>
              <UI.DetailSection>
                <h3><FileText size={20} /> Informações Gerais</h3>
                <UI.DetailGrid>
                  <UI.DetailItem>
                    <label>Número do Documento</label>
                    <div className="value">{invoiceDetails.BILLINGDOC}</div>
                  </UI.DetailItem>
                  <UI.DetailItem>
                    <label>Data de Faturamento</label>
                    <div className="value">{formatDate(invoiceDetails.BILL_DATE)}</div>
                  </UI.DetailItem>
                  <UI.DetailItem>
                    <label>Data de Vencimento</label>
                    <div className="value">{formatDate(invoiceDetails.NET_DATE)}</div>
                  </UI.DetailItem>
                  <UI.DetailItem>
                    <label>Condição de Pagamento</label>
                    <div className="value">{invoiceDetails.PMNTTRMS} {invoiceDetails.PMNTTRMS_TEXT && `- ${invoiceDetails.PMNTTRMS_TEXT}`}</div>
                  </UI.DetailItem>
                  <UI.DetailItem>
                    <label>Número da NFe</label>
                    <div className="value" style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                      {invoiceDetails.nfeNumber || invoiceDetails.NRO_NFE || '-'}
                    </div>
                  </UI.DetailItem>
                  <UI.DetailItem>
                    <label>CNPJ</label>
                    <div className="value">{formatCNPJ(invoiceDetails.cnpj)}</div>
                  </UI.DetailItem>
                </UI.DetailGrid>
              </UI.DetailSection>

              <UI.DetailSection>
                <h3><User size={20} /> Dados do Cliente</h3>
                <UI.DetailGrid>
                  <UI.DetailItem>
                    <label>Código</label>
                    <div className="value">{invoiceDetails.PAYER}</div>
                  </UI.DetailItem>
                  <UI.DetailItem>
                    <label>Nome</label>
                    <div className="value">
                      {invoiceDetails.customerName || 'Cliente ' + invoiceDetails.PAYER}
                      {invoiceDetails.customerName2 && ` ${invoiceDetails.customerName2}`}
                    </div>
                  </UI.DetailItem>
                  <UI.DetailItem>
                    <label>Código da Empresa</label>
                    <div className="value">{filters.companyCode}</div>
                  </UI.DetailItem>
                </UI.DetailGrid>
              </UI.DetailSection>

              <UI.DetailSection>
                <h3><CurrencyCircleDollar size={20} /> Valores</h3>
                <UI.DetailGrid>
                  <UI.DetailItem>
                    <label>Valor Líquido</label>
                    <div className="value">{formatCurrency(invoiceDetails.NET_VALUE)}</div>
                  </UI.DetailItem>
                  <UI.DetailItem>
                    <label>Status</label>
                    <div className="value">{getPaymentStatus(invoiceDetails.NET_DATE).label}</div>
                  </UI.DetailItem>
                  {calculateDaysOverdue(invoiceDetails.NET_DATE) > 0 && (
                    <UI.DetailItem>
                      <label>Dias em Atraso</label>
                      <div className="value" style={{ color: colors.error }}>
                        {calculateDaysOverdue(invoiceDetails.NET_DATE)} dias
                      </div>
                    </UI.DetailItem>
                  )}
                </UI.DetailGrid>
              </UI.DetailSection>

              {invoiceDetails.openItems && invoiceDetails.openItems.length > 0 && (
                <UI.DetailSection>
                  <h3><Bank size={20} /> Itens em Aberto</h3>
                  <UI.InstallmentsTable>
                    <thead>
                      <tr>
                        <th>Documento</th>
                        <th>Item</th>
                        <th>Data</th>
                        <th>Fornecedor</th>
                        <th>Valor</th>
                        <th>Método Pagamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceDetails.openItems.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.DOC_NO}</td>
                          <td>{item.ITEM_NUM}</td>
                          <td>{formatDate(item.DOC_DATE)}</td>
                          <td>{item.VENDOR}</td>
                          <td className="currency">{formatCurrency(item.AMT_DOCCUR)}</td>
                          <td>{item.PYMT_METH || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </UI.InstallmentsTable>
                </UI.DetailSection>
              )}
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

export default SapInvoices
