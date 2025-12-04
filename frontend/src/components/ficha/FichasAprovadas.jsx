import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Download, History, CheckCircle, RefreshCw } from 'lucide-react';

const FichasAprovadas = () => {
  const navigate = useNavigate();
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    periodo: '',
    projetista: '',
    material: ''
  });

  const limit = 20;

  const loadFichas = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await api.get(`/fichas/aprovadas?${params}`);
      setFichas(response.data.fichas);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Erro ao carregar fichas aprovadas');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadFichas();
  }, [loadFichas]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return format(parseISO(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const handleDownloadPDF = async (fichaId, codigo) => {
    try {
      const response = await api.get(`/pdf/ficha/${fichaId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ficha-${codigo}.pdf`);
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
        <p>Carregando fichas aprovadas...</p>
      </div>
    );
  }

  return (
    <div className="fichas-aprovadas-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <CheckCircle size={24} color="#22c55e" />
          <h2>Fichas Aprovadas</h2>
          <span className="badge badge-normal">{total} fichas</span>
        </div>
        <button className="btn btn-outline" onClick={loadFichas}>
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="form-group">
          <select
            className="form-select"
            value={filters.periodo}
            onChange={(e) => handleFilterChange('periodo', e.target.value)}
          >
            <option value="">Todos os períodos</option>
            <option value="7dias">Últimos 7 dias</option>
            <option value="30dias">Último mês</option>
          </select>
        </div>
        <div className="form-group">
          <input
            type="text"
            className="form-input"
            placeholder="Filtrar por projetista..."
            value={filters.projetista}
            onChange={(e) => handleFilterChange('projetista', e.target.value)}
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            className="form-input"
            placeholder="Filtrar por material..."
            value={filters.material}
            onChange={(e) => handleFilterChange('material', e.target.value)}
          />
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
                <th>Material</th>
                <th>Data Criação</th>
                <th>Data Aprovação</th>
                <th>Tempo Aprovação</th>
                <th>Reprovações</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {fichas.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    Nenhuma ficha aprovada encontrada
                  </td>
                </tr>
              ) : (
                fichas.map((ficha) => (
                  <tr key={ficha.id}>
                    <td>
                      <strong style={{ color: '#2563eb' }}>{ficha.codigo}</strong>
                    </td>
                    <td>{ficha.projetista}</td>
                    <td>{ficha.material}</td>
                    <td>{formatDate(ficha.createdAt)}</td>
                    <td>{formatDate(ficha.data_aprovacao)}</td>
                    <td>
                      {ficha.tempo_aprovacao_dias ? (
                        <span>{ficha.tempo_aprovacao_dias} dias</span>
                      ) : '-'}
                    </td>
                    <td>
                      {ficha.quantidade_reprovacoes > 0 ? (
                        <span style={{ color: '#f59e0b' }}>{ficha.quantidade_reprovacoes}x</span>
                      ) : (
                        <span style={{ color: '#22c55e' }}>Nenhuma</span>
                      )}
                    </td>
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
                          onClick={() => handleDownloadPDF(ficha.id, ficha.codigo)}
                          title="Baixar PDF"
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

export default FichasAprovadas;
