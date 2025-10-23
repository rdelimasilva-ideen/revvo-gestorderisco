import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { login, signInWithOAuth, setSession } from '../../services/authService';
import apiConfig from '../../config/api';

const FIXED_SAP_CREDENTIALS = {
  email: 'admin@ideen.tech',
  password: 'admin'
};

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const translateErrorMessage = (message) => {
    const errorMessages = {
      'Invalid login credentials': 'Email ou senha incorretos.',
      'Email not confirmed': 'Email não confirmado. Por favor, verifique sua caixa de entrada.',
      'Invalid email or password': 'Email ou senha inválidos.',
      'Email already registered': 'Este email já está registrado.',
      'User not found': 'Usuário não encontrado.',
      'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
      'Unable to validate email address': 'Não foi possível validar o endereço de email.',
      'Rate limit exceeded': 'Limite de tentativas excedido. Tente novamente mais tarde.'
    };

    return errorMessages[message] || message;
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: '', password: '' };

    // Validação simplificada para modo demo
    if (!formData.email || formData.email.trim() === '') {
      newErrors.email = 'Email é obrigatório';
      valid = false;
    }

    if (!formData.password || formData.password.trim() === '') {
      newErrors.password = 'Senha é obrigatória';
      valid = false;
    }

    setFormErrors(newErrors);
    return valid;
  };

  const getSapToken = async () => {
    try {
      // Usando o novo endpoint específico para token SAP
      const response = await fetch(`${apiConfig.SAP_CONNECTOR_URL}/${apiConfig.AUTH.SAP_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `username=${encodeURIComponent(FIXED_SAP_CREDENTIALS.email)}&password=${encodeURIComponent(FIXED_SAP_CREDENTIALS.password)}`
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('sap_token', data.access_token);
        return true;
      } else {
        console.log('Erro ao obter SAP token');
        return false;
      }
    } catch (error) {
      console.log('Erro ao conectar com SAP:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Login mock - aceita qualquer credencial para demonstração
      // Credenciais sugeridas: admin@ideen.tech / admin
      const mockUser = {
        id: '1',
        email: formData.email,
        user_metadata: {
          name: 'Usuário Demo'
        }
      };

      const mockTokens = {
        access_token: 'mock_access_token_' + Date.now(),
        refresh_token: 'mock_refresh_token_' + Date.now()
      };

      // Simular delay de autenticação
      await new Promise(resolve => setTimeout(resolve, 800));

      // Armazenar dados na sessão (localStorage para modo mock)
      localStorage.setItem('access_token', mockTokens.access_token);
      localStorage.setItem('refresh_token', mockTokens.refresh_token);
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('session', JSON.stringify({
        user: mockUser,
        access_token: mockTokens.access_token
      }));

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      console.log('Mock login successful');
      console.log('Redirecting to home page...');

      // Forçar redirecionamento usando window.location para garantir uma navegação completa
      window.location.href = '/';
    } catch (error) {
      console.log('Error logging in:', error.message);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: '' });
    }
    setError('');
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Usar nosso próprio serviço para login OAuth
      const { url } = await signInWithOAuth('google', window.location.origin);
      
      // Redirecionar para a URL de autorização do OAuth
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('URL de redirecionamento não fornecida');
      }
    } catch (error) {
      console.error('Error with Google login:', error);
      setError('Erro ao fazer login com Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
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

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <img
            src="https://utfs.io/f/vacIC1PeQNAlsDXzKKbIVgqwomYfjGCaLMdyBkcWtsEPlr89"
            alt="Revvo Logo"
            className="h-12 mb-8 mx-auto"
          />
          <h2 className="text-2xl font-onest font-semibold text-center mb-8">Para iniciar, faça seu login</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Insira seu e-mail"
                className={`w-full h-input px-6 border ${formErrors.email ? 'border-red-500' : 'border-gray-2'} rounded-md focus:outline-none focus:border-revvo-blue text-base font-onest`}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isLoading}
                aria-invalid={formErrors.email ? 'true' : 'false'}
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
                aria-invalid={formErrors.password ? 'true' : 'false'}
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

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-600 font-onest">Lembrar-me</span>
              </label>
              <button
                type="button"
                className="text-sm text-revvo-blue hover:underline font-onest bg-transparent border-0 p-0 outline-none"
                onClick={() => navigate('/forgot-password')}
                disabled={isLoading}
              >
                Esqueci minha senha
              </button>
            </div>

            <button
              type="submit"
              className={`w-full h-input bg-revvo-dark-blue text-white rounded-md transition-colors text-base font-onest font-semibold ${
                isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-opacity-90'
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>

            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-red-600 text-sm font-onest">{error}</p>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <div className="flex items-center justify-center">
              <div className="border-t border-gray-2 flex-grow"></div>
              <span className="px-4 text-gray-3 font-onest">ou</span>
              <div className="border-t border-gray-2 flex-grow"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className={`mt-4 w-full h-input border border-gray-2 rounded-md flex items-center justify-center gap-2 text-base font-onest font-light ${
                isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-50'
              }`}
              disabled={isLoading}
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
              Continuar com Google
            </button>

            <p className="mt-6 text-sm font-onest text-[16px]">
              Não possui uma conta?{' '}
              <Link to="/signup" className="text-revvo-blue hover:underline">
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
