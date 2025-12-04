import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { Plus, Edit, Trash2, Save, X, Users } from 'lucide-react';

const UserManagement = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usuariosRes, setoresRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/setores')
      ]);
      setUsuarios(usuariosRes.data);
      setSetores(setoresRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editingId) {
        await api.put(`/usuarios/${editingId}`, data);
        toast.success('Usuário atualizado com sucesso!');
      } else {
        await api.post('/usuarios', data);
        toast.success('Usuário criado com sucesso!');
      }
      setShowForm(false);
      setEditingId(null);
      reset();
      loadData();
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao salvar usuário';
      toast.error(message);
    }
  };

  const handleEdit = (usuario) => {
    setEditingId(usuario.id);
    reset({
      nome: usuario.nome,
      email: usuario.email,
      grupo: usuario.grupo,
      setor_id: usuario.setor_id || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja desativar este usuário?')) return;
    
    try {
      await api.delete(`/usuarios/${id}`);
      toast.success('Usuário desativado com sucesso!');
      loadData();
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao desativar usuário';
      toast.error(message);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    reset();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Form */}
      {showForm ? (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3>{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
            <button className="btn btn-outline btn-sm" onClick={handleCancel}>
              <X size={16} />
            </button>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input
                    type="text"
                    className={`form-input ${errors.nome ? 'error' : ''}`}
                    {...register('nome', { required: 'Campo obrigatório' })}
                  />
                  {errors.nome && <span className="form-error">{errors.nome.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    {...register('email', { 
                      required: 'Campo obrigatório',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido'
                      }
                    })}
                  />
                  {errors.email && <span className="form-error">{errors.email.message}</span>}
                </div>
              </div>

              <div className="form-row">
                {!editingId && (
                  <div className="form-group">
                    <label className="form-label">Senha *</label>
                    <input
                      type="password"
                      className={`form-input ${errors.senha ? 'error' : ''}`}
                      {...register('senha', { 
                        required: !editingId ? 'Campo obrigatório' : false,
                        minLength: {
                          value: 6,
                          message: 'Senha deve ter pelo menos 6 caracteres'
                        }
                      })}
                    />
                    {errors.senha && <span className="form-error">{errors.senha.message}</span>}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Grupo *</label>
                  <select
                    className={`form-select ${errors.grupo ? 'error' : ''}`}
                    {...register('grupo', { required: 'Campo obrigatório' })}
                  >
                    <option value="">Selecione...</option>
                    <option value="administrador">Administrador</option>
                    <option value="superior">Superior</option>
                    <option value="comum">Comum</option>
                  </select>
                  {errors.grupo && <span className="form-error">{errors.grupo.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Setor</label>
                  <select
                    className="form-select"
                    {...register('setor_id')}
                  >
                    <option value="">Nenhum (Administrador)</option>
                    {setores.map(setor => (
                      <option key={setor.id} value={setor.id}>{setor.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={handleCancel}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Novo Usuário
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} /> Usuários ({usuarios.length})
          </h3>
        </div>
        <div className="card-body">
          {usuarios.length === 0 ? (
            <div className="empty-state">
              <Users size={48} color="#64748b" />
              <p style={{ marginTop: '1rem' }}>Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Grupo</th>
                    <th>Setor</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} style={{ opacity: usuario.ativo ? 1 : 0.6 }}>
                      <td>{usuario.nome}</td>
                      <td>{usuario.email}</td>
                      <td>
                        <span 
                          className="kanban-card-badge"
                          style={{ 
                            backgroundColor: 
                              usuario.grupo === 'administrador' ? '#2563eb' :
                              usuario.grupo === 'superior' ? '#f59e0b' : '#64748b',
                            color: 'white'
                          }}
                        >
                          {usuario.grupo.charAt(0).toUpperCase() + usuario.grupo.slice(1)}
                        </span>
                      </td>
                      <td>{usuario.setor?.nome || '-'}</td>
                      <td>
                        <span style={{ color: usuario.ativo ? '#22c55e' : '#ef4444' }}>
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => handleEdit(usuario)}
                            title="Editar"
                          >
                            <Edit size={14} />
                          </button>
                          {usuario.ativo && (
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(usuario.id)}
                              title="Desativar"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
