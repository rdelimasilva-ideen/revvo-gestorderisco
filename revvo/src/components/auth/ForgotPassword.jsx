import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resetPasswordForEmail } from '../../services/authService';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      // Verificar se o email está preenchido
      if (!email.trim()) {
        throw new Error('Por favor, informe seu e-mail');
      }

      // Enviar email de recuperação de senha usando Supabase
      await resetPasswordForEmail(email);

      // Mostrar mensagem de sucesso
      setSuccessMessage('E-mail de recuperação enviado com sucesso! Por favor, verifique sua caixa de entrada.');
    } catch (error) {
      console.error('Error sending reset password email:', error.message);
      setError(error.message || 'Falha ao enviar o e-mail de recuperação. Por favor, tente novamente.');
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
            Recupere<br />seu acesso
          </h1>
          <p className="font-onest text-[20px] font-medium">
            Informe seu e-mail para receber<br />
            um link de recuperação de senha
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
          <h2 className="text-2xl font-onest font-semibold text-center mb-8">Recuperar senha</h2>

          {successMessage ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-600 font-onest">{successMessage}</p>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  className="text-revvo-blue hover:underline font-onest bg-transparent border-0 p-0 outline-none"
                  onClick={() => navigate('/login')}
                >
                  Voltar para o login
                </button>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Insira seu e-mail"
                    className="w-full h-input px-6 border border-gray-2 rounded-md focus:outline-none focus:border-revvo-blue text-base font-onest"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full h-input bg-revvo-dark-blue text-white rounded-md transition-colors text-base font-onest font-semibold ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-opacity-90'
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>

                {error && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600 text-sm font-onest">{error}</p>
                  </div>
                )}
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm font-onest text-[16px]">
                  Lembrou sua senha?{' '}
                  <Link to="/login" className="text-revvo-blue hover:underline">
                    Voltar ao login
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
