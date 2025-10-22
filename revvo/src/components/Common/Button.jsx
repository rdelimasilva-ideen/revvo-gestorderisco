import React from 'react';
import { StyledButton } from '../UI/ButtonUI';

const Button = ({
  children,
  variant = 'primary',
  loading = false,
  ...props
}) => {
  return (
    <StyledButton
      className={variant}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? 'Carregando...' : children}
    </StyledButton>
  );
};

export default Button;
