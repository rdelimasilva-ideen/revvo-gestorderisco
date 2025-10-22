import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { updateUser } from '../../services/authService';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Verificar se o usuário chegou aqui através do link de recuperação
    const checkRecoveryMode = async () => {
      const hash = window.location.hash;
      if (!hash || !hash.includes('type=recovery')) {
        navigate('/login');
      }
    };

    checkRecoveryMode();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validar as senhas
      if (password !== confirmPassword) {
        throw new Error('As senhas não coincidem');
      }

      if (password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres');
      }

      // Atualizar a senha do usuário
      const { error } = await updateUser({
        password
      });

      if (error) throw error;

      setSuccessMessage('Senha atualizada com sucesso!');

      // Redirecionar para o login após um pequeno delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      console.error('Error resetting password:', error.message);
      setError(error.message || 'Falha ao redefinir a senha. Por favor, tente novamente.');
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
            Redefina<br />sua senha
          </h1>
          <p className="font-onest text-[20px] font-medium">
            Crie uma nova senha segura<br />
            para acessar sua conta
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
          <h2 className="text-2xl font-onest font-semibold text-center mb-8">Redefinir senha</h2>

          {successMessage ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-600 font-onest">{successMessage}</p>
              </div>
              <p className="text-center text-sm text-gray-600">Redirecionando para a página de login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nova senha"
                  className="w-full h-input px-6 border border-gray-2 rounded-md focus:outline-none focus:border-revvo-blue text-base font-onest"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-transparent border-0 p-0 outline-none"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-3" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-3" />
                  )}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirme a nova senha"
                  className="w-full h-input px-6 border border-gray-2 rounded-md focus:outline-none focus:border-revvo-blue text-base font-onest"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-transparent border-0 p-0 outline-none"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-3" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-3" />
                  )}
                </button>
              </div>

              <button
                type="submit"
                className={`w-full h-input bg-revvo-dark-blue text-white rounded-md transition-colors text-base font-onest font-semibold ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-opacity-90'
                }`}
                disabled={isLoading}
              >
                {isLoading ? 'Atualizando...' : 'Atualizar senha'}
              </button>

              {error && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm font-onest">{error}</p>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
