import React from 'react';
import { InputContainer } from '../UI/InputUI';

const Input = ({ label, error, ...props }) => {
  return (
    <InputContainer>
      {label && <label>{label}</label>}
      <input {...props} />
      {error && <div className="error">{error}</div>}
    </InputContainer>
  );
};

export default Input;
