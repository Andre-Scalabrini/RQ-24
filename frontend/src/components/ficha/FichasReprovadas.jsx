import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, History, XCircle, RefreshCw, Download } from 'lucide-react';

const ETAPAS = {
  criacao: 'Criação',
  modelacao: 'Modelação',
  moldagem: 'Moldagem',
  fusao: 'Fusão',
  acabamento: 'Acabamento',
  analise_critica: 'Análise Crítica',
  inspecao: 'Inspeção',
  dimensional: 'Dimensional',
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
    periodo: '',
    motivo: '',
    etapa: ''
  });
  const [motivos, setMotivos] = useState([]);

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
    return format(parseISO(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const handleDownloadPDF = async (ficha) => {
    try {
      const response = await api.get(`/pdf/ficha/${ficha.id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ficha-${ficha.codigo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
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
          <h2>Fichas Reprovadas</h2>
          <span className="badge" style={{ backgroundColor: '#ef4444', color: 'white' }}>
            {total} fichas
          </span>
        </div>
        <button className="btn btn-outline" onClick={loadFichas}>
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      {/* Info Box */}
      <div style={{ 
        padding: '1rem',
        backgroundColor: '#fef2f2',
        borderRadius: '0.5rem',
        marginBottom: '1.5rem',
        borderLeft: '4px solid #ef4444'
      }}>
        <p style={{ color: '#991b1b', margin: 0, fontSize: '0.875rem' }}>
          Esta aba exibe todas as fichas que foram reprovadas durante o processo. 
          Fichas reprovadas são removidas do Kanban e não retornam para etapas anteriores.
        </p>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="form-group">
          <label className="form-label">Período</label>
          <select
            className="form-select"
            value={filters.periodo}
            onChange={(e) => handleFilterChange('periodo', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="7dias">Últimos 7 dias</option>
            <option value="30dias">Últimos 30 dias</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Motivo</label>
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
          <label className="form-label">Etapa Reprovada</label>
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
                <th>Código Peça</th>
                <th>Cliente</th>
                <th>Etapa Reprovada</th>
                <th>Motivo</th>
                <th>Responsável</th>
                <th>Data/Hora</th>
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
                      <strong style={{ color: '#ef4444' }}>{ficha.codigo}</strong>
                    </td>
                    <td>{ficha.codigo_peca || '-'}</td>
                    <td>{ficha.cliente || '-'}</td>
                    <td>
                      <span className="status-badge status-reprovada">
                        {ETAPAS[ficha.etapa_reprovacao] || ficha.etapa_reprovacao || '-'}
                      </span>
                    </td>
                    <td>
                      {ficha.ultimo_motivo || '-'}
                    </td>
                    <td>{ficha.reprovacoes?.[0]?.usuario?.nome || ficha.projetista || '-'}</td>
                    <td>{formatDate(ficha.data_reprovacao || ficha.ultima_reprovacao)}</td>
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
                          onClick={() => handleDownloadPDF(ficha)}
                          title="Gerar PDF"
                        >
                          <Download size={14} />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline"
                          onClick={() => navigate(`/fichas/${ficha.id}#historico`)}
                          title="Ver histórico"
                        >
                          <History size={14} />
                        </button>
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
    </div>
  );
};

export default FichasReprovadas;
