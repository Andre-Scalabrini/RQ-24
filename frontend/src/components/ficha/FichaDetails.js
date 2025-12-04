import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Edit, 
  ChevronRight, 
  Download,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const FichaDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canMoveFicha } = useAuth();
  const [ficha, setFicha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveObservacoes, setMoveObservacoes] = useState('');
  const [movingTo, setMovingTo] = useState(null);

  const ETAPAS = {
    criacao: 'Criação da Ficha',
    modelacao: 'Modelação',
    moldagem: 'Moldagem',
    fusao: 'Fusão',
    rebarbacao: 'Rebarbação',
    inspecao: 'Inspeção',
    usinagem: 'Usinagem',
    aprovado: 'Aprovado'
  };

  const loadFicha = useCallback(async () => {
    try {
      const response = await api.get(`/fichas/${id}`);
      setFicha(response.data);
    } catch (error) {
      toast.error('Erro ao carregar ficha');
      navigate('/fichas');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadFicha();
  }, [loadFicha]);

  const getProximaEtapa = () => {
    const etapas = Object.keys(ETAPAS);
    const indexAtual = etapas.indexOf(ficha.etapa_atual);
    
    if (indexAtual === -1 || indexAtual === etapas.length - 1) return null;
    
    let proximaEtapa = etapas[indexAtual + 1];
    
    // Se não possui usinagem, pula direto para aprovado
    if (proximaEtapa === 'usinagem' && !ficha.possui_usinagem) {
      proximaEtapa = 'aprovado';
    }
    
    return proximaEtapa;
  };

  const handleMoverEtapa = async () => {
    if (!movingTo) return;
    
    try {
      await api.post(`/fichas/${id}/mover`, {
        etapa_destino: movingTo,
        observacoes: moveObservacoes
      });
      toast.success('Ficha movida com sucesso!');
      setShowMoveModal(false);
      setMoveObservacoes('');
      loadFicha();
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao mover ficha';
      toast.error(message);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/pdf/ficha/${id}`, {
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

  const formatDate = (date) => {
    if (!date) return '-';
    return format(parseISO(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const formatDateOnly = (date) => {
    if (!date) return '-';
    return format(parseISO(date), "dd/MM/yyyy", { locale: ptBR });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando ficha...</p>
      </div>
    );
  }

  if (!ficha) {
    return null;
  }

  const proximaEtapa = getProximaEtapa();

  return (
    <div>
      {/* Header */}
      <div className="ficha-header">
        <div className="ficha-title">
          <button className="btn btn-outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
          </button>
          <h1>{ficha.codigo}</h1>
          {ficha.etapa_atual === 'aprovado' ? (
            <span className="ficha-status status-aprovado">
              <CheckCircle size={14} /> APROVADO
            </span>
          ) : ficha.atrasada ? (
            <span className="ficha-status status-atrasada">
              <AlertTriangle size={14} /> ATRASADA
            </span>
          ) : (
            <span className="ficha-status status-em-andamento">
              {ETAPAS[ficha.etapa_atual]}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {canMoveFicha() && proximaEtapa && (
            <button 
              className="btn btn-success"
              onClick={() => {
                setMovingTo(proximaEtapa);
                setShowMoveModal(true);
              }}
            >
              <ChevronRight size={16} /> Mover para {ETAPAS[proximaEtapa]}
            </button>
          )}
          <button className="btn btn-outline" onClick={handleDownloadPDF}>
            <Download size={16} /> PDF
          </button>
          <button className="btn btn-primary" onClick={() => navigate(`/fichas/${id}/editar`)}>
            <Edit size={16} /> Editar
          </button>
        </div>
      </div>

      {/* Dados Iniciais */}
      <div className="card ficha-section">
        <div className="card-header">
          <h2>Dados Iniciais</h2>
        </div>
        <div className="card-body">
          <div className="ficha-grid">
            <div className="ficha-field">
              <span className="ficha-field-label">Projetista</span>
              <span className="ficha-field-value">{ficha.projetista}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Quantidade Amostra</span>
              <span className="ficha-field-value">{ficha.quantidade_amostra}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Material</span>
              <span className="ficha-field-value">{ficha.material}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Peso da Peça</span>
              <span className="ficha-field-value">{ficha.peso_peca} kg</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Nº Peças por Molde</span>
              <span className="ficha-field-value">{ficha.numero_pecas_molde}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Processo de Moldagem</span>
              <span className="ficha-field-value">{ficha.processo_moldagem}</span>
            </div>
            {ficha.processo_moldagem === 'JOB' && (
              <>
                <div className="ficha-field">
                  <span className="ficha-field-label">Dimensão Lado Extração</span>
                  <span className="ficha-field-value">{ficha.dimensao_lado_extracao || '-'}</span>
                </div>
                <div className="ficha-field">
                  <span className="ficha-field-label">Dimensão Lado Fixo</span>
                  <span className="ficha-field-value">{ficha.dimensao_lado_fixo || '-'}</span>
                </div>
                <div className="ficha-field">
                  <span className="ficha-field-label">Extratores</span>
                  <span className="ficha-field-value">{ficha.extratores || '-'}</span>
                </div>
              </>
            )}
            <div className="ficha-field">
              <span className="ficha-field-label">Prazo Final</span>
              <span className="ficha-field-value" style={{ color: ficha.atrasada ? '#ef4444' : undefined }}>
                {formatDateOnly(ficha.prazo_final)}
              </span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Peso Molde de Areia</span>
              <span className="ficha-field-value">{ficha.peso_molde_areia} kg</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Peso da Árvore</span>
              <span className="ficha-field-value">{ficha.peso_arvore} kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Campos Calculados */}
      <div className="card ficha-section">
        <div className="card-header">
          <h2>Campos Calculados</h2>
        </div>
        <div className="card-body">
          <div className="ficha-grid">
            <div className="ficha-field">
              <span className="ficha-field-label">RAM</span>
              <span className="ficha-field-value">{ficha.ram ? parseFloat(ficha.ram).toFixed(3) : '-'}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">RM</span>
              <span className="ficha-field-value">{ficha.rm ? `${parseFloat(ficha.rm).toFixed(2)}%` : '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dados da Ferramenta */}
      <div className="card ficha-section">
        <div className="card-header">
          <h2>Dados da Ferramenta</h2>
        </div>
        <div className="card-body">
          <div className="ficha-grid">
            <div className="ficha-field">
              <span className="ficha-field-label">Qtd. Figuras na Ferramenta</span>
              <span className="ficha-field-value">{ficha.quantidade_figuras_ferramenta}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Material da Ferramenta</span>
              <span className="ficha-field-value">{ficha.material_ferramenta}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Caixas de Macho */}
      {ficha.caixas_macho && ficha.caixas_macho.length > 0 && (
        <div className="card ficha-section">
          <div className="card-header">
            <h2>Caixas de Macho ({ficha.caixas_macho.length})</h2>
          </div>
          <div className="card-body">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nº Machos/Peça</th>
                    <th>Nº Figuras</th>
                    <th>Peso do Macho</th>
                    <th>Processo</th>
                    <th>Qualidade Areia</th>
                    <th>Pintura</th>
                  </tr>
                </thead>
                <tbody>
                  {ficha.caixas_macho.map((caixa, index) => (
                    <tr key={caixa.id}>
                      <td>{index + 1}</td>
                      <td>{caixa.numero_machos_peca}</td>
                      <td>{caixa.numero_figuras_caixa_macho}</td>
                      <td>{caixa.peso_macho} kg</td>
                      <td>{caixa.processo}</td>
                      <td>{caixa.qualidade_areia_macho}</td>
                      <td>{caixa.possui_pintura_macho ? `Sim (${caixa.tipo_pintura_macho})` : 'Não'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Moldes de Árvore */}
      {ficha.moldes_arvore && ficha.moldes_arvore.length > 0 && (
        <div className="card ficha-section">
          <div className="card-header">
            <h2>Moldes de Árvore ({ficha.moldes_arvore.length})</h2>
          </div>
          <div className="card-body">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nº Molde</th>
                    <th>Qualidade</th>
                    <th>Validado Por</th>
                    <th>Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {ficha.moldes_arvore.map((molde) => (
                    <tr key={molde.id}>
                      <td>{molde.numero_molde}</td>
                      <td>
                        {molde.qualidade_aprovada === null ? (
                          <span style={{ color: '#64748b' }}>Pendente</span>
                        ) : molde.qualidade_aprovada ? (
                          <span style={{ color: '#22c55e' }}>Aprovado</span>
                        ) : (
                          <span style={{ color: '#ef4444' }}>Reprovado</span>
                        )}
                      </td>
                      <td>{molde.validador?.nome || '-'}</td>
                      <td>{molde.observacoes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Outros Dados */}
      <div className="card ficha-section">
        <div className="card-header">
          <h2>Outros Dados</h2>
        </div>
        <div className="card-body">
          <div className="ficha-grid">
            <div className="ficha-field">
              <span className="ficha-field-label">Posição de Vazamento</span>
              <span className="ficha-field-value">{ficha.posicao_vazamento}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Resfriadores</span>
              <span className="ficha-field-value">
                {ficha.possui_resfriadores ? `Sim (${ficha.quantidade_resfriadores})` : 'Não'}
              </span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Lateral de Aço</span>
              <span className="ficha-field-value">{ficha.lateral_aco || '-'}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Luva Kalpur</span>
              <span className="ficha-field-value">{ficha.luva_kalpur || '-'}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Trat. Térmico Peça Bruta</span>
              <span className="ficha-field-value">{ficha.tratamento_termico_peca_bruta || '-'}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Possui Usinagem</span>
              <span className="ficha-field-value">{ficha.possui_usinagem ? 'Sim' : 'Não'}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Possui Pintura</span>
              <span className="ficha-field-value">{ficha.possui_pintura ? 'Sim' : 'Não'}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Trat. Térmico Após Usinagem</span>
              <span className="ficha-field-value">{ficha.tratamento_termico_apos_usinagem || '-'}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Tratamento Superficial</span>
              <span className="ficha-field-value">{ficha.tratamento_superficial || '-'}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Possui Retífica</span>
              <span className="ficha-field-value">{ficha.possui_retifica ? 'Sim' : 'Não'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Movimentações */}
      {ficha.movimentacoes && ficha.movimentacoes.length > 0 && (
        <div className="card ficha-section">
          <div className="card-header">
            <h2>Histórico de Movimentações</h2>
          </div>
          <div className="card-body">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>De</th>
                    <th>Para</th>
                    <th>Usuário</th>
                    <th>Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {ficha.movimentacoes.map((mov) => (
                    <tr key={mov.id}>
                      <td>{formatDate(mov.data_movimentacao)}</td>
                      <td>{ETAPAS[mov.etapa_origem] || mov.etapa_origem}</td>
                      <td>{ETAPAS[mov.etapa_destino] || mov.etapa_destino}</td>
                      <td>{mov.usuario?.nome || '-'}</td>
                      <td>{mov.observacoes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Informações do Sistema */}
      <div className="card ficha-section">
        <div className="card-header">
          <h2>Informações do Sistema</h2>
        </div>
        <div className="card-body">
          <div className="ficha-grid">
            <div className="ficha-field">
              <span className="ficha-field-label">Criado por</span>
              <span className="ficha-field-value">{ficha.criador?.nome || '-'}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Criado em</span>
              <span className="ficha-field-value">{formatDate(ficha.created_at)}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Última atualização</span>
              <span className="ficha-field-value">{formatDate(ficha.updated_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Movimentação */}
      {showMoveModal && (
        <div className="modal-overlay" onClick={() => setShowMoveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Mover Ficha</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowMoveModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem' }}>
                Você está movendo a ficha <strong>{ficha.codigo}</strong> para a etapa{' '}
                <strong>{ETAPAS[movingTo]}</strong>.
              </p>
              <div className="form-group">
                <label className="form-label">Observações (opcional)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={moveObservacoes}
                  onChange={(e) => setMoveObservacoes(e.target.value)}
                  placeholder="Adicione observações sobre a movimentação..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowMoveModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-success" onClick={handleMoverEtapa}>
                Confirmar Movimentação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FichaDetails;
