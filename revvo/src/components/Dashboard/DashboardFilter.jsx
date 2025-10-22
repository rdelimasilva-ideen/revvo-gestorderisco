import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ChevronDown } from 'lucide-react';
import { CustomerService } from '../../services/customerService';
import * as UI from '../UI/DashboardFilterUI'

const DashboardFilter = ({ selectedCustomer }) => {
  const [customerDetails, setCustomerDetails] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    async function fetchCustomerDetails() {
      if (selectedCustomer) {
        try {
          const data = await CustomerService.getCustomerDetails(selectedCustomer);
          let addressString = '';
          let cityString = '';
          if (data.address && !Array.isArray(data.address)) {
            const addr = data.address;
            addressString = `${addr.street || ''}${addr.num ? ', ' + addr.num : ''}`.trim();
            cityString = `${addr.city || ''}${addr.state ? ' - ' + addr.state : ''}${addr.zcode ? ', ' + addr.zcode : ''}`.trim();
          }
          if (data) {
            setCustomerDetails({
              id: data.id,
              name: data.name,
              companyName: data.company?.name,
              companyCode: data.company_code,
              cnpj: data.costumer_cnpj,
              address: addressString,
              city: cityString,
              contacts: [
                { name: data.name, phone: data.costumer_phone, email: data.costumer_email }
              ]
            });
          }
        } catch (error) {
          console.error('Error fetching customer details:', error);
          setCustomerDetails(null);
        }
      } else {
        setCustomerDetails(null);
      }
    }
    fetchCustomerDetails();
  }, [selectedCustomer]);

  return (
    <div>
      <UI.SearchBar isExpanded={isExpanded}>
        {customerDetails && (
          <div className="customer-details">
            <div className="header">
              <div className="header-content">
                <h2>{customerDetails.name}</h2>
                <div className="legal-name">{customerDetails.companyName}</div>
                <div className="company-code">{customerDetails.companyCode}</div>
              </div>
              <button
                className="toggle-button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Comprimir" : "Expandir"}
              >
                <ChevronDown size={20} />
              </button>
            </div>

            <div className="content">
              <div className="company-info">
                <div className="info-field">
                  <label>CNPJ</label>
                  <p>{customerDetails.cnpj}</p>
                </div>

                <div className="info-field">
                  <label>Endereço</label>
                  <p>{customerDetails.address}</p>
                  <p>{customerDetails.city}</p>
                </div>
              </div>

              <div className="contacts-section">
                <div className="contacts-scroll">
                  {customerDetails.contacts.map((contact, index) => (
                    <div className="contact-card" key={index}>
                      <div className="name">{contact.name}</div>
                      <div className="contact-info">
                        <p>{contact.phone}</p>
                        <p><a href={`mailto:${contact.email}`}>{contact.email}</a></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </UI.SearchBar>
    </div>
  );
};

export default DashboardFilter;
