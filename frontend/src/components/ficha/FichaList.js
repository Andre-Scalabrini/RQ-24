import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { format, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Plus,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const FichaList = () => {
  const navigate = useNavigate();
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEtapa, setFilterEtapa] = useState('');
  const [filterAtrasada, setFilterAtrasada] = useState('');

  const ETAPAS = {
    criacao: 'Criação',
    modelacao: 'Modelação',
    moldagem: 'Moldagem',
    fusao: 'Fusão',
    rebarbacao: 'Rebarbação',
    inspecao: 'Inspeção',
    usinagem: 'Usinagem',
    aprovado: 'Aprovado'
  };

  const loadFichas = useCallback(async () => {
    try {
      let url = '/fichas?';
      if (filterEtapa) url += `etapa=${filterEtapa}&`;
      if (filterAtrasada) url += `atrasada=${filterAtrasada}`;
      
      const response = await api.get(url);
      setFichas(response.data);
    } catch (error) {
      toast.error('Erro ao carregar fichas');
    } finally {
      setLoading(false);
    }
  }, [filterEtapa, filterAtrasada]);

  useEffect(() => {
    loadFichas();
  }, [loadFichas]);

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta ficha?')) return;
    
    try {
      await api.delete(`/fichas/${id}`);
      toast.success('Ficha excluída com sucesso!');
      loadFichas();
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao excluir ficha';
      toast.error(message);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return format(parseISO(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const isLate = (prazoFinal) => {
    return prazoFinal && isPast(parseISO(prazoFinal));
  };

  const filteredFichas = fichas.filter(ficha => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      ficha.codigo.toLowerCase().includes(term) ||
      ficha.projetista.toLowerCase().includes(term) ||
      ficha.material.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando fichas...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
              <label className="form-label">Buscar</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Código, projetista, material..."
                  style={{ paddingLeft: '2.5rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ minWidth: '150px', marginBottom: 0 }}>
              <label className="form-label">Etapa</label>
              <select
                className="form-select"
                value={filterEtapa}
                onChange={(e) => setFilterEtapa(e.target.value)}
              >
                <option value="">Todas</option>
                {Object.entries(ETAPAS).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ minWidth: '150px', marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={filterAtrasada}
                onChange={(e) => setFilterAtrasada(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="true">Atrasadas</option>
                <option value="false">No prazo</option>
              </select>
            </div>

            <button 
              className="btn btn-primary"
              onClick={() => navigate('/fichas/nova')}
            >
              <Plus size={16} /> Nova Ficha
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body">
          {filteredFichas.length === 0 ? (
            <div className="empty-state">
              <Filter size={48} color="#64748b" />
              <p style={{ marginTop: '1rem' }}>Nenhuma ficha encontrada</p>
              <button 
                className="btn btn-primary" 
                style={{ marginTop: '1rem' }}
                onClick={() => navigate('/fichas/nova')}
              >
                <Plus size={16} /> Criar Nova Ficha
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Projetista</th>
                    <th>Material</th>
                    <th>Etapa</th>
                    <th>Prazo</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFichas.map((ficha) => (
                    <tr key={ficha.id}>
                      <td>
                        <span style={{ fontWeight: 500, color: '#2563eb' }}>{ficha.codigo}</span>
                      </td>
                      <td>{ficha.projetista}</td>
                      <td>{ficha.material}</td>
                      <td>
                        <span 
                          className="kanban-card-badge"
                          style={{ 
                            backgroundColor: ficha.etapa_atual === 'aprovado' ? '#22c55e' : '#64748b',
                            color: 'white'
                          }}
                        >
                          {ETAPAS[ficha.etapa_atual]}
                        </span>
                      </td>
                      <td style={{ color: isLate(ficha.prazo_final) ? '#ef4444' : undefined }}>
                        {formatDate(ficha.prazo_final)}
                      </td>
                      <td>
                        {ficha.etapa_atual === 'aprovado' ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#22c55e' }}>
                            <CheckCircle size={14} /> Aprovado
                          </span>
                        ) : ficha.atrasada || isLate(ficha.prazo_final) ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444' }}>
                            <AlertTriangle size={14} /> Atrasada
                          </span>
                        ) : (
                          <span style={{ color: '#22c55e' }}>No prazo</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => navigate(`/fichas/${ficha.id}`)}
                            title="Visualizar"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => navigate(`/fichas/${ficha.id}/editar`)}
                            title="Editar"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(ficha.id)}
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
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

export default FichaList;
