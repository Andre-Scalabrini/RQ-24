import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { Factory, Lock, Mail } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.senha);
      toast.success('Login realizado com sucesso!');
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao fazer login';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Factory size={48} color="#2563eb" />
          <h1>RQ-24</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Sistema de Aprovação de Peças
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">
              <Mail size={16} style={{ marginRight: '0.5rem' }} />
              Email
            </label>
            <input
              type="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="seu@email.com"
              {...register('email', {
                required: 'Email é obrigatório',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido'
                }
              })}
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={16} style={{ marginRight: '0.5rem' }} />
              Senha
            </label>
            <input
              type="password"
              className={`form-input ${errors.senha ? 'error' : ''}`}
              placeholder="••••••"
              {...register('senha', { required: 'Senha é obrigatória' })}
            />
            {errors.senha && <span className="form-error">{errors.senha.message}</span>}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: '#64748b' }}>
          Usuário padrão: admin@empresa.com / admin123
        </p>
      </div>
    </div>
  );
};

export default Login;
