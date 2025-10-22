import React, { useState, useEffect } from 'react';
import * as UI from '../UI/RuleModalUI';
import { X, Plus, Trash2 } from 'lucide-react';

const RuleModal = ({ isOpen, onClose, rule, onSave }) => {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'Crédito',
    status: 'ativa',
    condicoes: [{ campo: '', operador: '=', valor: '' }],
    acoes: [{ tipo: '', valor: '' }]
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        nome: rule.nome || '',
        descricao: rule.descricao || '',
        tipo: rule.tipo || 'Crédito',
        status: rule.status || 'ativa',
        condicoes: rule.condicoes || [{ campo: '', operador: '=', valor: '' }],
        acoes: rule.acoes || [{ tipo: '', valor: '' }]
      });
    } else {
      setFormData({
        nome: '',
        descricao: '',
        tipo: 'Crédito',
        status: 'ativa',
        condicoes: [{ campo: '', operador: '=', valor: '' }],
        acoes: [{ tipo: '', valor: '' }]
      });
    }
  }, [rule, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCondicaoChange = (index, field, value) => {
    const newCondicoes = [...formData.condicoes];
    newCondicoes[index][field] = value;
    setFormData(prev => ({ ...prev, condicoes: newCondicoes }));
  };

  const handleAcaoChange = (index, field, value) => {
    const newAcoes = [...formData.acoes];
    newAcoes[index][field] = value;
    setFormData(prev => ({ ...prev, acoes: newAcoes }));
  };

  const addCondicao = () => {
    setFormData(prev => ({
      ...prev,
      condicoes: [...prev.condicoes, { campo: '', operador: '=', valor: '' }]
    }));
  };

  const removeCondicao = (index) => {
    if (formData.condicoes.length > 1) {
      const newCondicoes = formData.condicoes.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, condicoes: newCondicoes }));
    }
  };

  const addAcao = () => {
    setFormData(prev => ({
      ...prev,
      acoes: [...prev.acoes, { tipo: '', valor: '' }]
    }));
  };

  const removeAcao = (index) => {
    if (formData.acoes.length > 1) {
      const newAcoes = formData.acoes.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, acoes: newAcoes }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validação básica
    if (!formData.nome.trim()) {
      alert('Por favor, preencha o nome da regra');
      return;
    }

    if (!formData.descricao.trim()) {
      alert('Por favor, preencha a descrição da regra');
      return;
    }

    // Validar condições
    const condicoesValidas = formData.condicoes.every(
      c => c.campo.trim() && c.operador && c.valor.trim()
    );
    if (!condicoesValidas) {
      alert('Por favor, preencha todas as condições');
      return;
    }

    // Validar ações
    const acoesValidas = formData.acoes.every(
      a => a.tipo.trim() && a.valor.trim()
    );
    if (!acoesValidas) {
      alert('Por favor, preencha todas as ações');
      return;
    }

    const ruleData = {
      ...formData,
      id: rule?.id || Date.now(),
      ultima_execucao: rule?.ultima_execucao || '-',
      execucoes: rule?.execucoes || 0
    };

    onSave(ruleData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <UI.Overlay onClick={onClose}>
      <UI.ModalContainer onClick={(e) => e.stopPropagation()}>
        <UI.ModalHeader>
          <UI.ModalTitle>
            {rule ? 'Editar Regra' : 'Nova Regra'}
          </UI.ModalTitle>
          <UI.CloseButton onClick={onClose}>
            <X size={24} />
          </UI.CloseButton>
        </UI.ModalHeader>

        <UI.ModalContent>
          <form onSubmit={handleSubmit}>
            <UI.FormSection>
              <UI.SectionTitle>Informações Básicas</UI.SectionTitle>

              <UI.FormGroup>
                <UI.Label>Nome da Regra *</UI.Label>
                <UI.Input
                  type="text"
                  placeholder="Ex: Limite Automático por Score"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  required
                />
              </UI.FormGroup>

              <UI.FormGroup>
                <UI.Label>Descrição *</UI.Label>
                <UI.Textarea
                  placeholder="Descreva o que esta regra faz..."
                  value={formData.descricao}
                  onChange={(e) => handleChange('descricao', e.target.value)}
                  rows={3}
                  required
                />
              </UI.FormGroup>

              <UI.FormRow>
                <UI.FormGroup>
                  <UI.Label>Tipo *</UI.Label>
                  <UI.Select
                    value={formData.tipo}
                    onChange={(e) => handleChange('tipo', e.target.value)}
                  >
                    <option value="Crédito">Crédito</option>
                    <option value="Alerta">Alerta</option>
                    <option value="Workflow">Workflow</option>
                  </UI.Select>
                </UI.FormGroup>

                <UI.FormGroup>
                  <UI.Label>Status *</UI.Label>
                  <UI.Select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    <option value="ativa">Ativa</option>
                    <option value="inativa">Inativa</option>
                  </UI.Select>
                </UI.FormGroup>
              </UI.FormRow>
            </UI.FormSection>

            <UI.FormSection>
              <UI.SectionHeader>
                <UI.SectionTitle>Condições</UI.SectionTitle>
                <UI.AddButton type="button" onClick={addCondicao}>
                  <Plus size={16} />
                  Adicionar Condição
                </UI.AddButton>
              </UI.SectionHeader>

              {formData.condicoes.map((condicao, index) => (
                <UI.ConditionRow key={index}>
                  <UI.FormGroup style={{ flex: 2 }}>
                    <UI.Label>Campo</UI.Label>
                    <UI.Input
                      type="text"
                      placeholder="Ex: Score"
                      value={condicao.campo}
                      onChange={(e) => handleCondicaoChange(index, 'campo', e.target.value)}
                      required
                    />
                  </UI.FormGroup>

                  <UI.FormGroup style={{ flex: 1 }}>
                    <UI.Label>Operador</UI.Label>
                    <UI.Select
                      value={condicao.operador}
                      onChange={(e) => handleCondicaoChange(index, 'operador', e.target.value)}
                    >
                      <option value="=">=</option>
                      <option value="!=">!=</option>
                      <option value=">">{'>'}</option>
                      <option value=">=">{'>='.replace(/>/g, '>')}</option>
                      <option value="<">{'<'}</option>
                      <option value="<=">{'<='.replace(/</g, '<')}</option>
                      <option value="IN">IN</option>
                    </UI.Select>
                  </UI.FormGroup>

                  <UI.FormGroup style={{ flex: 2 }}>
                    <UI.Label>Valor</UI.Label>
                    <UI.Input
                      type="text"
                      placeholder="Ex: 800"
                      value={condicao.valor}
                      onChange={(e) => handleCondicaoChange(index, 'valor', e.target.value)}
                      required
                    />
                  </UI.FormGroup>

                  {formData.condicoes.length > 1 && (
                    <UI.RemoveButton type="button" onClick={() => removeCondicao(index)}>
                      <Trash2 size={16} />
                    </UI.RemoveButton>
                  )}
                </UI.ConditionRow>
              ))}
            </UI.FormSection>

            <UI.FormSection>
              <UI.SectionHeader>
                <UI.SectionTitle>Ações</UI.SectionTitle>
                <UI.AddButton type="button" onClick={addAcao}>
                  <Plus size={16} />
                  Adicionar Ação
                </UI.AddButton>
              </UI.SectionHeader>

              {formData.acoes.map((acao, index) => (
                <UI.ConditionRow key={index}>
                  <UI.FormGroup style={{ flex: 2 }}>
                    <UI.Label>Tipo de Ação</UI.Label>
                    <UI.Input
                      type="text"
                      placeholder="Ex: Definir Limite"
                      value={acao.tipo}
                      onChange={(e) => handleAcaoChange(index, 'tipo', e.target.value)}
                      required
                    />
                  </UI.FormGroup>

                  <UI.FormGroup style={{ flex: 2 }}>
                    <UI.Label>Valor</UI.Label>
                    <UI.Input
                      type="text"
                      placeholder="Ex: R$ 100.000"
                      value={acao.valor}
                      onChange={(e) => handleAcaoChange(index, 'valor', e.target.value)}
                      required
                    />
                  </UI.FormGroup>

                  {formData.acoes.length > 1 && (
                    <UI.RemoveButton type="button" onClick={() => removeAcao(index)}>
                      <Trash2 size={16} />
                    </UI.RemoveButton>
                  )}
                </UI.ConditionRow>
              ))}
            </UI.FormSection>

            <UI.ModalFooter>
              <UI.CancelButton type="button" onClick={onClose}>
                Cancelar
              </UI.CancelButton>
              <UI.SaveButton type="submit">
                {rule ? 'Salvar Alterações' : 'Criar Regra'}
              </UI.SaveButton>
            </UI.ModalFooter>
          </form>
        </UI.ModalContent>
      </UI.ModalContainer>
    </UI.Overlay>
  );
};

export default RuleModal;
