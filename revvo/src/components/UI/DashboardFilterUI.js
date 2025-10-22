import styled from "styled-components";

export const SearchBar = styled.div`
  margin: 24px 0;

  .customer-details {
    background: white;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    padding: 24px;

    .header {
      margin-bottom: ${props => props.isExpanded ? '24px' : '0'};
      border-bottom: ${props => props.isExpanded ? '1px solid #E5E7EB' : 'none'};
      padding-bottom: ${props => props.isExpanded ? '16px' : '0'};
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      .header-content {
        flex: 1;

        h2 {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }

        .legal-name {
          font-size: 14px;
          color: #6B7280;
        }

        .company-code {
          font-size: 14px;
          color: #6B7280;
          margin-top: 4px;
        }
      }

      .toggle-button {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: #6B7280;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        margin-top: 4px;

        &:hover {
          background: #F3F4F6;
          color: #111827;
        }

        svg {
          transition: transform 0.2s ease;
          transform: ${props => props.isExpanded ? 'rotate(180deg)' : 'rotate(0)'};
        }
      }
    }

    .content {
      display: ${props => props.isExpanded ? 'flex' : 'none'};
      gap: 48px;
      overflow: hidden;

      .company-info {
        display: flex;
        gap: 48px;
        flex: 1;

        .info-field {
          flex: 1;

          label {
            display: block;
            font-size: 13px;
            color: #6B7280;
            font-weight: 500;
            margin-bottom: 4px;
            text-transform: uppercase;
          }

          p {
            font-size: 14px;
            color: #111827;
            line-height: 1.4;
          }
        }
      }

      .contacts-section {
        flex: 1;
        overflow: hidden;
        position: relative;

        .contacts-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 4px;
          margin: -4px;
          padding: 4px;
          scroll-behavior: smooth;

          &::-webkit-scrollbar {
            height: 4px;
          }

          &::-webkit-scrollbar-track {
            background: #F3F4F6;
            border-radius: 2px;
          }

          &::-webkit-scrollbar-thumb {
            background: #D1D5DB;
            border-radius: 2px;
          }
        }

        .contact-card {
          min-width: 260px;
          background: #F9FAFB;
          padding: 16px;
          border-radius: 6px;

          .name {
            font-size: 14px;
            font-weight: 500;
            color: #111827;
            margin-bottom: 12px;
          }

          .contact-info {
            font-size: 14px;
            color: #6B7280;

            p {
              margin-bottom: 4px;

              &:last-child {
                margin-bottom: 0;
              }
            }

            a {
              color: #2563EB;
              text-decoration: none;

              &:hover {
                text-decoration: underline;
              }
            }
          }
        }
      }
    }
  }
`;
