import React, { useState } from 'react'
import * as UI from './UI/OrderDetailsUI';
import { X, CaretRight, CheckCircle, Circle, Clock } from '@phosphor-icons/react'

function OrderDetails({ order, onClose }) {
  const [selectedStep, setSelectedStep] = useState(null)
  const [modalType, setModalType] = useState(null) // 'view' or 'approve'

  const handleStepClick = (step, type) => {
    setSelectedStep(step)
    setModalType(type)
  }

  const closeModal = () => {
    setSelectedStep(null)
    setModalType(null)
  }

  return (
    <UI.Container>
      <UI.Header>
        <h1>Ordem de Venda {order.id}</h1>
        <button className="close-button" onClick={onClose}>
          <X size={20} />
        </button>
      </UI.Header>

      <UI.Grid>
        <UI.Card>
          <UI.CardHeader>Resumo da Ordem de Vendas</UI.CardHeader>
          <UI.CardContent>
            <UI.Field className="grid">
              <div>
                <label>Data de Criação</label>
                <div className="value">15/03/2024, 07:30:00</div>
              </div>
              <div>
                <label>Última Atualização</label>
                <div className="value">15/03/2024, 07:30:00</div>
              </div>
            </UI.Field>

            <UI.Field>
              <label>ID do Parceiro</label>
              <div className="value">#1001</div>
            </UI.Field>

            <UI.Field>
              <label>Parceiro</label>
              <div className="value">Clínica Estética Bella Vita</div>
            </UI.Field>

            <UI.Field>
              <label>Itens do Pedido</label>
              <UI.OrderItem>
                <div className="name">Implante Mamário Redondo</div>
                <div className="details">
                  <span>2x R$ 2.500,00</span>
                  <span>R$ 4.500,00</span>
                </div>
                <div className="details">
                  <span></span>
                  <span className="discount">Desconto: R$ 500,00</span>
                </div>
              </UI.OrderItem>
              <UI.OrderItem>
                <div className="name">Implante Facial Mentoplastia</div>
                <div className="details">
                  <span>3x R$ 1.800,00</span>
                  <span>R$ 5.200,00</span>
                </div>
                <div className="details">
                  <span></span>
                  <span className="discount">Desconto: R$ 200,00</span>
                </div>
              </UI.OrderItem>
            </UI.Field>

            <UI.Field className="grid">
              <div>
                <label>Total de Itens</label>
                <div className="value">5</div>
              </div>
              <div>
                <label>Valor Total</label>
                <div className="value">R$ 9.700,00</div>
              </div>
            </UI.Field>
          </UI.CardContent>
        </UI.Card>

        <UI.Card>
          <UI.CardHeader>Análise de Crédito</UI.CardHeader>
          <UI.CardContent>
            <UI.Score>
              <div className="score">
                <div className="value">85</div>
                <label>Score</label>
              </div>
              <div className="rating">
                <div className="value">AA</div>
                <label>Rating</label>
              </div>
            </UI.Score>

            <UI.Field>
              <label>Situação Atual</label>
              <UI.Status>Em dia</UI.Status>
            </UI.Field>

            <UI.Field className="grid">
              <div>
                <label>Status</label>
                <div className="value">Em dia</div>
              </div>
              <div>
                <label>Dias em Atraso (6m)</label>
                <div className="value">0 dias</div>
              </div>
            </UI.Field>

            <UI.Field>
              <label>Limites</label>
              <div className="grid" style={{ marginTop: '8px' }}>
                <div>
                  <label>Limite Total</label>
                  <div className="value">R$ 50.000,00</div>
                </div>
                <div>
                  <label>Disponível</label>
                  <div className="value">R$ 27.100,00</div>
                </div>
              </div>
              <div className="grid" style={{ marginTop: '8px' }}>
                <div>
                  <label>Utilização Atual</label>
                  <div className="value">45.8%</div>
                </div>
                <div>
                  <label>Média Últimos 6m</label>
                  <div className="value">38.5%</div>
                </div>
              </div>
            </UI.Field>

            <UI.Field>
              <label>Histórico de Vendas</label>
              <div style={{ marginTop: '8px' }}>
                <label>Volume últimos 6 meses</label>
                <div className="value">R$ 145.000,00</div>
              </div>
            </UI.Field>
          </UI.CardContent>
        </UI.Card>
      </UI.Grid>

      <UI.Workflow>
        <UI.WorkflowSteps>
          <UI.Step>
            <div className="icon completed">
              <CheckCircle size={20} weight="fill" />
            </div>
            <div className="label">Analista de crédito</div>
          </UI.Step>
          <UI.Step>
            <div className="icon completed">
              <CheckCircle size={20} weight="fill" />
            </div>
            <div className="label">Gerente de crédito</div>
          </UI.Step>
          <UI.Step>
            <div className="icon current">
              <Clock size={20} weight="fill" />
            </div>
            <div className="label">Aprovação Comercial</div>
          </UI.Step>
          <UI.Step>
            <div className="icon">
              <Circle size={20} />
            </div>
            <div className="label">Diretor financeiro</div>
          </UI.Step>
        </UI.WorkflowSteps>

        <UI.StepDetails>
          <UI.StepItem onClick={() => handleStepClick('analyst', 'view')}>
            <div className="title">Analista de crédito</div>
            <div className="subtitle">Analista de Crédito</div>
          </UI.StepItem>
          <UI.StepItem onClick={() => handleStepClick('manager', 'view')}>
            <div className="title">Gerente de crédito</div>
            <div className="subtitle">Gerente de Crédito</div>
          </UI.StepItem>
          <UI.StepItem className="current" onClick={() => handleStepClick('commercial', 'approve')}>
            <div className="title">Aprovação Comercial</div>
            <div className="subtitle">Gerente Comercial</div>
          </UI.StepItem>
          <UI.StepItem>
            <div className="title">Diretor financeiro</div>
            <div className="subtitle">Diretor Financeiro</div>
          </UI.StepItem>
        </UI.StepDetails>
      </UI.Workflow>

      {selectedStep && (
        <UI.Modal>
          <UI.ModalContent>
            <UI.ModalHeader>
              <h2>
                {modalType === 'view' ? (
                  selectedStep === 'analyst' ? 'Analista de crédito' : 'Gerente de crédito'
                ) : 'Aprovação Comercial'}
              </h2>
              <button onClick={closeModal}>
                <X size={20} />
              </button>
            </UI.ModalHeader>

            <UI.ModalBody>
              <UI.ModalField>
                <label>Alçada</label>
                <div className="value">
                  {modalType === 'view' ? (
                    selectedStep === 'analyst' ? 'Analista de Crédito' : 'Gerente de Crédito'
                  ) : 'Gerente Comercial'}
                </div>
              </UI.ModalField>

              {modalType === 'view' && (
                <>
                  <UI.ModalField>
                    <label>Status</label>
                    <div className="value">Aprovado</div>
                  </UI.ModalField>
                  <UI.ModalField>
                    <label>Decisor</label>
                    <div className="value">Maria Silva</div>
                  </UI.ModalField>
                </>
              )}

              <UI.ModalField className="grid">
                <div>
                  <label>Data de Recebimento</label>
                  <div className="value">15/03/2024, {modalType === 'view' ? '07:35' : '09:30'}:00</div>
                </div>
                <div>
                  <label>Prazo</label>
                  <div className="value">15/03/2024, {modalType === 'view' ? '11:35' : '13:30'}:00</div>
                </div>
              </UI.ModalField>

              <UI.ModalField>
                <label>Parecer</label>
                {modalType === 'view' ? (
                  <div className="value">Cliente com bom histórico de pagamentos e limite disponível.</div>
                ) : (
                  <textarea placeholder="Digite seu parecer..." />
                )}
              </UI.ModalField>
            </UI.ModalBody>

            {modalType === 'approve' && (
              <UI.ModalFooter>
                <button className="reject">Rejeitar</button>
                <button className="approve">Aprovar</button>
              </UI.ModalFooter>
            )}
          </UI.ModalContent>
        </UI.Modal>
      )}
    </UI.Container>
  )
}

export default OrderDetails
