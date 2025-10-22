import styled from 'styled-components';

export const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
`;

export const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 4px 0;
`;

export const Subtitle = styled.p`
  font-size: 14px;
  color: #718096;
  margin: 0;
`;

export const HeaderActions = styled.div`
  display: flex;
  gap: 12px;

  @media (max-width: 768px) {
    width: 100%;

    button {
      flex: 1;
    }
  }
`;

export const PrimaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #2563eb;
  }

  &:active {
    transform: scale(0.98);
  }
`;

export const FilterButton = styled.button`
  padding: 10px 20px;
  background-color: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }
`;

export const FilterContainer = styled.div`
  display: flex;
  gap: 16px;
  padding: 20px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

export const FilterLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: #374151;
`;

export const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background-color: white;
  color: #1f2937;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

export const SearchInput = styled.input`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background-color: white;
  color: #1f2937;
  transition: all 0.2s;

  &::placeholder {
    color: #9ca3af;
  }

  &:hover {
    border-color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

export const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

export const StatCard = styled.div`
  padding: 20px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

export const StatLabel = styled.div`
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 500;
`;

export const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
`;

export const RulesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const RuleCard = styled.div`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: #d1d5db;
  }
`;

export const RuleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
`;

export const RuleName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
`;

export const RuleDescription = styled.p`
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
`;

export const RuleActions = styled.div`
  display: flex;
  gap: 4px;
  flex-shrink: 0;
`;

export const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background-color: transparent;
  border: none;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f3f4f6;
    color: #1f2937;
  }

  &:active {
    transform: scale(0.95);
  }
`;

export const RuleMetadata = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

export const RuleBadge = styled.span`
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;

  ${props => {
    switch (props.type) {
      case 'crédito':
        return `
          background-color: #dbeafe;
          color: #1e40af;
        `;
      case 'alerta':
        return `
          background-color: #fef3c7;
          color: #92400e;
        `;
      case 'workflow':
        return `
          background-color: #e0e7ff;
          color: #3730a3;
        `;
      default:
        return `
          background-color: #f3f4f6;
          color: #374151;
        `;
    }
  }}
`;

export const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;

  ${props => props.status === 'ativa' ? `
    background-color: #d1fae5;
    color: #065f46;
  ` : `
    background-color: #f3f4f6;
    color: #6b7280;
  `}
`;

export const RuleSection = styled.div`
  margin-bottom: 16px;

  &:last-of-type {
    margin-bottom: 12px;
  }
`;

export const SectionTitle = styled.h4`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
`;

export const ConditionItem = styled.div`
  font-size: 13px;
  color: #4b5563;
  padding: 6px 12px;
  background-color: #f9fafb;
  border-left: 3px solid #3b82f6;
  border-radius: 4px;
  margin-bottom: 4px;

  strong {
    color: #1f2937;
  }
`;

export const ActionItem = styled.div`
  font-size: 13px;
  color: #4b5563;
  padding: 6px 12px;
  background-color: #f0fdf4;
  border-left: 3px solid #10b981;
  border-radius: 4px;
  margin-bottom: 4px;

  strong {
    color: #1f2937;
  }
`;

export const RuleFooter = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  gap: 12px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 4px;
  }
`;

export const FooterText = styled.span`
  font-size: 12px;
  color: #9ca3af;
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
  font-size: 14px;
  background-color: white;
  border: 1px dashed #d1d5db;
  border-radius: 12px;

  p {
    margin: 0;
  }
`;
