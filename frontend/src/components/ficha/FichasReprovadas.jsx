import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, History, XCircle, RefreshCw, AlertOctagon, RotateCcw, Ban } from 'lucide-react';

const ETAPAS = {
  criacao: 'Criação',
  modelacao: 'Modelação',
  moldagem: 'Moldagem',
  fusao: 'Fusão',
  rebarbacao: 'Rebarbação',
  inspecao: 'Inspeção',
  usinagem: 'Usinagem'
};

const FichasReprovadas = () => {
  const navigate = useNavigate();
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    motivo: '',
    etapa: ''
  });
  const [motivos, setMotivos] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ show: false, fichaId: null, codigo: '' });

  const limit = 20;

  const loadFichas = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await api.get(`/fichas/reprovadas?${params}`);
      setFichas(response.data.fichas);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Erro ao carregar fichas reprovadas');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const loadMotivos = async () => {
    try {
      const response = await api.get('/fichas/motivos-reprovacao');
      setMotivos(response.data);
    } catch (error) {
      console.error('Erro ao carregar motivos:', error);
    }
  };

  useEffect(() => {
    loadFichas();
    loadMotivos();
  }, [loadFichas]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return format(parseISO(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const handleReprovarFinal = async () => {
    try {
      await api.put(`/fichas/${confirmModal.fichaId}/reprovar-final`, {
        observacoes: 'Ficha marcada como reprovada final pelo usuário'
      });
      toast.success('Ficha marcada como reprovada final');
      setConfirmModal({ show: false, fichaId: null, codigo: '' });
      loadFichas();
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao reprovar ficha';
      toast.error(message);
    }
  };

  if (loading && fichas.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando fichas reprovadas...</p>
      </div>
    );
  }

  return (
    <div className="fichas-reprovadas-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <XCircle size={24} color="#ef4444" />
          <h2>Fichas Reprovadas / Em Retrabalho</h2>
          <span className="badge" style={{ backgroundColor: '#ef4444', color: 'white' }}>
            {total} fichas
          </span>
        </div>
        <button className="btn btn-outline" onClick={loadFichas}>
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      {/* Status Legend */}
      <div className="status-legend">
        <div className="legend-item">
          <RotateCcw size={14} color="#f59e0b" />
          <span>Em Retrabalho</span>
        </div>
        <div className="legend-item">
          <Ban size={14} color="#ef4444" />
          <span>Reprovada Final</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="form-group">
          <select
            className="form-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="em_retrabalho">Em Retrabalho</option>
            <option value="reprovada_final">Reprovada Final</option>
          </select>
        </div>
        <div className="form-group">
          <select
            className="form-select"
            value={filters.motivo}
            onChange={(e) => handleFilterChange('motivo', e.target.value)}
          >
            <option value="">Todos os motivos</option>
            {motivos.map((m, index) => (
              <option key={index} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <select
            className="form-select"
            value={filters.etapa}
            onChange={(e) => handleFilterChange('etapa', e.target.value)}
          >
            <option value="">Todas as etapas</option>
            {Object.entries(ETAPAS).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nº Ficha</th>
                <th>Projetista</th>
                <th>Último Motivo</th>
                <th>Reprovações</th>
                <th>Status</th>
                <th>Etapa Atual</th>
                <th>Última Reprovação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {fichas.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    Nenhuma ficha reprovada encontrada
                  </td>
                </tr>
              ) : (
                fichas.map((ficha) => (
                  <tr key={ficha.id}>
                    <td>
                      <strong style={{ color: '#2563eb' }}>{ficha.codigo}</strong>
                    </td>
                    <td>{ficha.projetista}</td>
                    <td>
                      {ficha.ultimo_motivo || '-'}
                    </td>
                    <td>
                      <span style={{ 
                        color: ficha.quantidade_reprovacoes >= 3 ? '#ef4444' : '#f59e0b',
                        fontWeight: 600
                      }}>
                        {ficha.quantidade_reprovacoes}x
                      </span>
                    </td>
                    <td>
                      {ficha.status === 'reprovada_final' ? (
                        <span className="status-badge status-reprovada">
                          <Ban size={12} /> Reprovada Final
                        </span>
                      ) : (
                        <span className="status-badge status-retrabalho">
                          <RotateCcw size={12} /> Em Retrabalho
                        </span>
                      )}
                    </td>
                    <td>
                      {ficha.status === 'reprovada_final' ? '-' : (
                        ETAPAS[ficha.etapa_atual] || ficha.etapa_atual
                      )}
                    </td>
                    <td>{formatDate(ficha.ultima_reprovacao)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button 
                          className="btn btn-sm btn-outline"
                          onClick={() => navigate(`/fichas/${ficha.id}`)}
                          title="Ver detalhes"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline"
                          onClick={() => navigate(`/fichas/${ficha.id}#historico`)}
                          title="Ver histórico de reprovações"
                        >
                          <History size={14} />
                        </button>
                        {ficha.status !== 'reprovada_final' && (
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => setConfirmModal({ 
                              show: true, 
                              fichaId: ficha.id, 
                              codigo: ficha.codigo 
                            })}
                            title="Marcar como reprovada final"
                          >
                            <AlertOctagon size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="btn btn-sm btn-outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </button>
            <span>Página {page} de {totalPages}</span>
            <button 
              className="btn btn-sm btn-outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="modal-overlay" onClick={() => setConfirmModal({ show: false, fichaId: null, codigo: '' })}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ backgroundColor: '#fef2f2' }}>
              <h3 style={{ color: '#ef4444' }}>
                <AlertOctagon size={20} /> Confirmar Reprovação Final
              </h3>
            </div>
            <div className="modal-body">
              <p>
                Você está prestes a marcar a ficha <strong>{confirmModal.codigo}</strong> como 
                <strong style={{ color: '#ef4444' }}> Reprovada Final</strong>.
              </p>
              <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
                Esta ação encerra definitivamente a ficha e não poderá ser desfeita.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline" 
                onClick={() => setConfirmModal({ show: false, fichaId: null, codigo: '' })}
              >
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleReprovarFinal}>
                Confirmar Reprovação Final
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FichasReprovadas;
