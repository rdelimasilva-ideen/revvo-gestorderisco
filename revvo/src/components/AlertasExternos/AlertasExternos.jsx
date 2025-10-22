import React from 'react';
import * as UI from '../UI/AlertasExternosUI';
import { Gavel, FileWarning, FileCheck } from 'lucide-react';

const AlertasExternos = () => {
  // Mock data para processos judiciais
  const legalProcesses = [
    {
      company: 'Hospital Santa Casa',
      details: 'Processo trabalhista em andamento',
      date: '15/12/2024',
      value: 85000
    },
    {
      company: 'Clínica Bella Vita',
      details: 'Ação de cobrança movida',
      date: '12/12/2024',
      value: 45000
    },
    {
      company: 'Instituto Médico São Paulo',
      details: 'Processo cível em primeira instância',
      date: '08/12/2024',
      value: 120000
    }
  ];

  // Mock data para protestos
  const protests = [
    {
      company: 'Centro Médico Avançado',
      details: 'Protesto de duplicata vencida',
      date: '18/12/2024',
      value: 25000
    },
    {
      company: 'Hospital Regional Norte',
      details: 'Protesto de cheque devolvido',
      date: '14/12/2024',
      value: 15000
    },
    {
      company: 'Clínica Especializada Sul',
      details: 'Protesto de nota promissória',
      date: '10/12/2024',
      value: 35000
    }
  ];

  // Mock data para certidões
  const certificates = [
    {
      company: 'Clínica Popular Centro',
      details: 'Certidão negativa de débitos vencida',
      date: '20/12/2024',
      value: 0
    },
    {
      company: 'Hospital Comunitário',
      details: 'Certidão de regularidade fiscal pendente',
      date: '16/12/2024',
      value: 0
    },
    {
      company: 'Centro de Diagnóstico',
      details: 'Certidão trabalhista em atraso',
      date: '13/12/2024',
      value: 0
    }
  ];

  const formatCurrency = (value) => {
    if (value === 0) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const sections = [
    {
      title: 'Processos Judiciais',
      icon: Gavel,
      data: legalProcesses,
      iconClass: 'red'
    },
    {
      title: 'Protestos',
      icon: FileWarning,
      data: protests,
      iconClass: 'orange'
    },
    {
      title: 'Certidões',
      icon: FileCheck,
      data: certificates,
      iconClass: 'blue'
    }
  ];

  return (
    <UI.Container>
      <UI.Header>
        <h2>Alertas Externos</h2>
      </UI.Header>

      <UI.GridContainer>
        {sections.map((section) => {
          const IconComponent = section.icon;
          return (
            <UI.AlertCard key={section.title}>
              <UI.CardHeader>
                <h3>{section.title}</h3>
              </UI.CardHeader>
              <UI.AlertList>
                {section.data.map((alert, index) => (
                  <UI.AlertItem key={index}>
                    <UI.AlertContent>
                      <UI.IconContainer className={section.iconClass}>
                        <IconComponent size={16} />
                      </UI.IconContainer>
                      <UI.AlertDetails>
                        <div className="company-name">{alert.company}</div>
                        <div className="alert-description">{alert.details}</div>
                        <div className="alert-date">{alert.date}</div>
                      </UI.AlertDetails>
                    </UI.AlertContent>
                    {alert.value > 0 && (
                      <UI.AlertValue>
                        {formatCurrency(alert.value)}
                      </UI.AlertValue>
                    )}
                  </UI.AlertItem>
                ))}
              </UI.AlertList>
            </UI.AlertCard>
          );
        })}
      </UI.GridContainer>
    </UI.Container>
  );
};

export default AlertasExternos;
