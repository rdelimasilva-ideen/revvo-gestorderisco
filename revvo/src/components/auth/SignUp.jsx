import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { signup } from '../../services/authService';

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    cnpj: '',
    userName: '',
    email: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({
    companyName: '',
    cnpj: '',
    userName: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Format CNPJ as the user types (XX.XXX.XXX/XXXX-XX)
  const formatCNPJ = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Apply CNPJ mask
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 5) {
      return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    } else if (digits.length <= 8) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    } else if (digits.length <= 12) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    } else {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
    }
  };

  // Validação básica de CNPJ
  const isValidCNPJ = (cnpj) => {
    const digits = cnpj.replace(/\D/g, '');
    return digits.length === 14;
  };

  // Tradução de mensagens de erro do Supabase
  const translateErrorMessage = (message) => {
    const errorMessages = {
      'Invalid login credentials': 'Credenciais de login inválidas.',
      'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
      'Invalid email': 'Email inválido.',
      'Email already registered': 'Este email já está registrado.',
      'User already registered': 'Este usuário já está cadastrado.',
      'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
      'Unable to validate email address': 'Não foi possível validar o endereço de email.',
      'Rate limit exceeded': 'Limite de tentativas excedido. Tente novamente mais tarde.',
      'Database error saving new user': 'Erro ao salvar usuário. Por favor, tente novamente.'
    };

    return errorMessages[message] || message;
  };

  const handleInputChange = (field, value) => {
    // Atualizar o estado do formulário
    setFormData({ ...formData, [field]: value });

    // Limpar erro do campo quando o usuário começa a digitar
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: '' });
    }

    // Limpar mensagens gerais
    setError('');
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      companyName: '',
      cnpj: '',
      userName: '',
      email: '',
      password: ''
    };

    // Validar Nome da Empresa
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Nome da empresa é obrigatório';
      isValid = false;
    }

    // Validar CNPJ
    if (!formData.cnpj.trim()) {
      newErrors.cnpj = 'CNPJ é obrigatório';
      isValid = false;
    } else if (!isValidCNPJ(formData.cnpj)) {
      newErrors.cnpj = 'CNPJ inválido. Digite os 14 dígitos';
      isValid = false;
    }

    // Validar Nome do Usuário
    if (!formData.userName.trim()) {
      newErrors.userName = 'Nome do usuário é obrigatório';
      isValid = false;
    }

    // Validar Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Digite um email válido';
      isValid = false;
    }

    // Validar Senha
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await signup({
        email: formData.email,
        password: formData.password,
        name: formData.userName,
        company: formData.companyName,
        cnpj: formData.cnpj
      });
      setSuccessMessage('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side with gradient background */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-left relative">
        <img
          src="https://ky4ov9pv1r.ufs.sh/f/vacIC1PeQNAlDswuZB88a7yWn6wgksjifxH4eGOmQR9DLvlN"
          alt="Background Pattern"
          className="absolute left-0 bottom-0 opacity-100"
        />
        <div className="text-white pl-48 pr-16 py-16 z-10 flex flex-col justify-center w-full">
          <img
            src="https://ky4ov9pv1r.ufs.sh/f/vacIC1PeQNAlhUNzEasnBIAxdQCj9eGRJluP31YK8vSzt2Wo"
            alt="Revvo Logo"
            className="w-40 h-auto mb-8"
          />
          <h1 className="font-onest text-[64px] leading-tight mb-4 font-bold tracking-normal">
            Olá, seja<br />bem-vindo!
          </h1>
          <p className="font-onest text-[20px] font-medium">
            Cadastre-se hoje e subtítulo e etc<br />
            subtítulo e etc subtítulo
          </p>
        </div>
      </div>

      {/* Right side with form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <img
            src="https://utfs.io/f/vacIC1PeQNAlsDXzKKbIVgqwomYfjGCaLMdyBkcWtsEPlr89"
            alt="Revvo Logo"
            className="h-12 mb-8 mx-auto"
          />
          <h2 className="text-2xl font-onest font-semibold text-center mb-8">Criar conta</h2>

          {successMessage ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-green-600 font-onest">{successMessage}</p>
              </div>
              <p className="text-center text-sm text-gray-600 font-onest">Redirecionando para a página de login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Nome da Empresa"
                  className={`w-full h-input px-6 border ${formErrors.companyName ? 'border-red-500' : 'border-gray-2'} rounded-md focus:outline-none focus:border-revvo-blue text-base font-onest`}
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  disabled={isLoading}
                />
                {formErrors.companyName && (
                  <div className="flex items-center mt-1 text-red-500 text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    <span>{formErrors.companyName}</span>
                  </div>
                )}
              </div>

              <div>
                <input
                  type="text"
                  maxLength={18}
                  placeholder="CNPJ"
                  className={`w-full h-input px-6 border ${formErrors.cnpj ? 'border-red-500' : 'border-gray-2'} rounded-md focus:outline-none focus:border-revvo-blue text-base font-onest`}
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange('cnpj', formatCNPJ(e.target.value))}
                  disabled={isLoading}
                />
                {formErrors.cnpj && (
                  <div className="flex items-center mt-1 text-red-500 text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    <span>{formErrors.cnpj}</span>
                  </div>
                )}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Nome do Usuário"
                  className={`w-full h-input px-6 border ${formErrors.userName ? 'border-red-500' : 'border-gray-2'} rounded-md focus:outline-none focus:border-revvo-blue text-base font-onest`}
                  value={formData.userName}
                  onChange={(e) => handleInputChange('userName', e.target.value)}
                  disabled={isLoading}
                />
                {formErrors.userName && (
                  <div className="flex items-center mt-1 text-red-500 text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    <span>{formErrors.userName}</span>
                  </div>
                )}
              </div>

              <div>
                <input
                  type="email"
                  placeholder="Insira seu e-mail"
                  className={`w-full h-input px-6 border ${formErrors.email ? 'border-red-500' : 'border-gray-2'} rounded-md focus:outline-none focus:border-revvo-blue text-base font-onest`}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value.trim())}
                  disabled={isLoading}
                />
                {formErrors.email && (
                  <div className="flex items-center mt-1 text-red-500 text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    <span>{formErrors.email}</span>
                  </div>
                )}
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Insira sua senha"
                  className={`w-full h-input px-6 border ${formErrors.password ? 'border-red-500' : 'border-gray-2'} rounded-md focus:outline-none focus:border-revvo-blue text-base font-onest`}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-transparent border-0 p-0 outline-none"
                  disabled={isLoading}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-3" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-3" />
                  )}
                </button>
                {formErrors.password && (
                  <div className="flex items-center mt-1 text-red-500 text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    <span>{formErrors.password}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className={`w-full h-input bg-revvo-dark-blue text-white rounded-md transition-colors text-base font-onest font-semibold ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-opacity-90'
                }`}
                disabled={isLoading}
              >
                {isLoading ? 'Criando conta...' : 'Criar conta'}
              </button>

              {error && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-red-600 text-sm font-onest">{error}</p>
                </div>
              )}
            </form>
          )}

          {!successMessage && (
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center">
                <div className="border-t border-gray-2 flex-grow"></div>
                <span className="px-4 text-gray-3 font-onest">ou</span>
                <div className="border-t border-gray-2 flex-grow"></div>
              </div>

              <button
                className={`mt-4 w-full h-input border border-gray-2 rounded-md flex items-center justify-center gap-2 text-base font-onest font-light ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
                disabled={isLoading}
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                Continuar com Google
              </button>

              <p className="mt-6 text-sm font-onest text-[16px]">
                Já possui uma conta?{' '}
                <Link to="/login" className="text-revvo-blue hover:underline">
                  Faça login
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUp;
