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
  AlertTriangle,
  XCircle,
  Ban
} from 'lucide-react';
import ModalReprovacao from './ModalReprovacao';
import HistoricoReprovacoes from './HistoricoReprovacoes';

const FichaDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canMoveFicha } = useAuth();
  const [ficha, setFicha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showReprovacaoModal, setShowReprovacaoModal] = useState(false);
  const [moveObservacoes, setMoveObservacoes] = useState('');
  const [movingTo, setMovingTo] = useState(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [reprovacoes, setReprovacoes] = useState([]);

  const ETAPAS = {
    criacao: 'Criação da Ficha',
    modelacao: 'Modelação',
    moldagem: 'Moldagem',
    fusao: 'Fusão',
    acabamento: 'Acabamento',
    analise_critica: 'Análise Crítica',
    inspecao: 'Inspeção',
    dimensional: 'Dimensional',
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

  const loadReprovacoes = useCallback(async () => {
    try {
      const response = await api.get(`/fichas/${id}/reprovacoes`);
      setReprovacoes(response.data);
    } catch (error) {
      console.error('Erro ao carregar reprovações:', error);
    }
  }, [id]);

  useEffect(() => {
    loadFicha();
    loadReprovacoes();
  }, [loadFicha, loadReprovacoes]);

  const getProximaEtapa = () => {
    const etapas = Object.keys(ETAPAS);
    const indexAtual = etapas.indexOf(ficha.etapa_atual);
    
    if (indexAtual === -1 || indexAtual === etapas.length - 1) return null;
    
    let proximaEtapa = etapas[indexAtual + 1];
    
    // Se não possui usinagem, pula direto para aprovado (conforme RQ-24: de Dimensional para Aprovado)
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
    setDownloadingPDF(true);
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
      const message = error.response?.status === 404 
        ? 'Ficha não encontrada' 
        : 'Erro ao gerar PDF. Tente novamente.';
      toast.error(message);
    } finally {
      setDownloadingPDF(false);
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
  const canReject = canMoveFicha() && ficha.status === 'em_andamento' && ficha.etapa_atual !== 'criacao';

  return (
    <div>
      {/* Header */}
      <div className="ficha-header">
        <div className="ficha-title">
          <button className="btn btn-outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
          </button>
          <h1>{ficha.codigo}</h1>
          {ficha.status === 'reprovada_final' ? (
            <span className="ficha-status" style={{ backgroundColor: '#ef4444', color: 'white' }}>
              <Ban size={14} /> REPROVADA FINAL
            </span>
          ) : ficha.etapa_atual === 'aprovado' || ficha.status === 'aprovada' ? (
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
          {ficha.quantidade_reprovacoes > 0 && (
            <span className="ficha-status" style={{ backgroundColor: '#f59e0b', color: 'white' }}>
              <XCircle size={14} /> {ficha.quantidade_reprovacoes}x Reprovações
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {canMoveFicha() && proximaEtapa && ficha.status === 'em_andamento' && (
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
          {canReject && (
            <button 
              className="btn btn-danger"
              onClick={() => setShowReprovacaoModal(true)}
            >
              <XCircle size={16} /> Reprovar
            </button>
          )}
          <button 
            className="btn btn-outline" 
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
          >
            <Download size={16} /> {downloadingPDF ? 'Gerando...' : 'PDF'}
          </button>
          <button className="btn btn-primary" onClick={() => navigate(`/fichas/${id}/editar`)}>
            <Edit size={16} /> Editar
          </button>
        </div>
      </div>

      {/* Cabeçalho */}
      <div className="card ficha-section">
        <div className="card-header">
          <h2>Cabeçalho</h2>
        </div>
        <div className="card-body">
          <div className="ficha-grid">
            <div className="ficha-field">
              <span className="ficha-field-label">Projetista</span>
              <span className="ficha-field-value">{ficha.projetista}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Código da Peça</span>
              <span className="ficha-field-value">{ficha.codigo_peca || '-'}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Cliente</span>
              <span className="ficha-field-value">{ficha.cliente || '-'}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Data de Criação</span>
              <span className="ficha-field-value">{formatDateOnly(ficha.createdAt || ficha.created_at)}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Quantidade de Amostra</span>
              <span className="ficha-field-value">{ficha.quantidade_amostra}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Prazo Final</span>
              <span className="ficha-field-value" style={{ color: ficha.atrasada ? '#ef4444' : undefined }}>
                {formatDateOnly(ficha.prazo_final)}
              </span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Seguir Norma</span>
              <span className="ficha-field-value">{ficha.seguir_norma || '-'}</span>
            </div>
            {ficha.descricao_peca && (
              <div className="ficha-field" style={{ gridColumn: '1 / -1' }}>
                <span className="ficha-field-label">Descrição da Peça</span>
                <span className="ficha-field-value">{ficha.descricao_peca}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dados Gerais - Estimado vs Obtido */}
      <div className="card ficha-section">
        <div className="card-header">
          <h2>Dados Gerais</h2>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Campo</th>
                  <th>Estimado</th>
                  <th>Obtido</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Material</td>
                  <td>{ficha.material_estimado || ficha.material || '-'}</td>
                  <td>{ficha.material_obtido || '-'}</td>
                </tr>
                <tr>
                  <td>Peso da Peça (kg)</td>
                  <td>{ficha.peso_peca_estimado || ficha.peso_peca || '-'}</td>
                  <td>{ficha.peso_peca_obtido || '-'}</td>
                </tr>
                <tr>
                  <td>Nº Peças por Molde</td>
                  <td>{ficha.numero_pecas_molde_estimado || ficha.numero_pecas_molde || '-'}</td>
                  <td>{ficha.numero_pecas_molde_obtido || '-'}</td>
                </tr>
                <tr>
                  <td>Peso do Molde (kg)</td>
                  <td>{ficha.peso_molde_estimado || ficha.peso_molde_areia || '-'}</td>
                  <td>{ficha.peso_molde_obtido || '-'}</td>
                </tr>
                <tr>
                  <td>Peso da Árvore (kg)</td>
                  <td>{ficha.peso_arvore_estimado || ficha.peso_arvore || '-'}</td>
                  <td>{ficha.peso_arvore_obtido || '-'}</td>
                </tr>
                <tr>
                  <td>RAM</td>
                  <td>{ficha.ram_estimado || ficha.ram ? parseFloat(ficha.ram_estimado || ficha.ram).toFixed(3) : '-'}</td>
                  <td>{ficha.ram_obtido ? parseFloat(ficha.ram_obtido).toFixed(3) : '-'}</td>
                </tr>
                <tr>
                  <td>RM (%)</td>
                  <td>{ficha.rm_estimado || ficha.rm ? `${parseFloat(ficha.rm_estimado || ficha.rm).toFixed(2)}%` : '-'}</td>
                  <td>{ficha.rm_obtido ? `${parseFloat(ficha.rm_obtido).toFixed(2)}%` : '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Moldagem */}
      <div className="card ficha-section">
        <div className="card-header">
          <h2>Moldagem</h2>
        </div>
        <div className="card-body">
          <div className="ficha-grid">
            <div className="ficha-field">
              <span className="ficha-field-label">Processo de Moldagem</span>
              <span className="ficha-field-value">{ficha.processo_moldagem || '-'}</span>
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
          </div>
        </div>
      </div>

      {/* Modelação - Dados da Ferramenta */}
      <div className="card ficha-section">
        <div className="card-header">
          <h2>Modelação - Dados da Ferramenta</h2>
        </div>
        <div className="card-body">
          <div className="ficha-grid">
            <div className="ficha-field">
              <span className="ficha-field-label">Qtd. Figuras na Ferramenta</span>
              <span className="ficha-field-value">{ficha.quantidade_figuras_ferramenta || '-'}</span>
            </div>
            <div className="ficha-field">
              <span className="ficha-field-label">Material do Ferramental</span>
              <span className="ficha-field-value">{ficha.material_ferramenta || '-'}</span>
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
                    <th>ID</th>
                    <th>Material Caixa</th>
                    <th>Peso Caixa</th>
                    <th>Nº Machos/Peça</th>
                    <th>Nº Figuras</th>
                    <th>Peso do Macho</th>
                    <th>Processo</th>
                    <th>Qualidade Areia</th>
                    <th>Prod/Hora</th>
                    <th>Pintura</th>
                  </tr>
                </thead>
                <tbody>
                  {ficha.caixas_macho.map((caixa, index) => (
                    <tr key={caixa.id}>
                      <td>{String.fromCharCode(65 + index)}</td>
                      <td>{caixa.material_caixa_macho || '-'}</td>
                      <td>{caixa.peso_caixa_macho ? `${caixa.peso_caixa_macho} kg` : '-'}</td>
                      <td>{caixa.numero_machos_peca}</td>
                      <td>{caixa.numero_figuras_caixa_macho}</td>
                      <td>{caixa.peso_macho} kg</td>
                      <td>{caixa.processo}</td>
                      <td>{caixa.qualidade_areia_macho}</td>
                      <td>{caixa.producao_machos_hora || '-'}</td>
                      <td>{caixa.possui_pintura_macho ? `Sim (${caixa.tipo_pintura_macho})` : 'Não'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Moldes de Árvore (Acabamento) */}
      {ficha.moldes_arvore && ficha.moldes_arvore.length > 0 && (
        <div className="card ficha-section">
          <div className="card-header">
            <h2>Acabamento - Moldes de Árvore ({ficha.moldes_arvore.length})</h2>
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

      {/* Luvas / Kalpur */}
      {ficha.luvas_kalpur && ficha.luvas_kalpur.length > 0 && (
        <div className="card ficha-section">
          <div className="card-header">
            <h2>Luvas / Kalpur ({ficha.luvas_kalpur.length})</h2>
          </div>
          <div className="card-body">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Quantidade</th>
                    <th>Descrição</th>
                    <th>Peso (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {ficha.luvas_kalpur.map((luva, index) => (
                    <tr key={luva.id}>
                      <td>{index + 1}</td>
                      <td>{luva.quantidade}</td>
                      <td>{luva.descricao || '-'}</td>
                      <td>{luva.peso_kg || '-'}</td>
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
              <span className="ficha-field-value">{ficha.posicao_vazamento || '-'}</span>
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
            {!ficha.luvas_kalpur?.length && (
              <div className="ficha-field">
                <span className="ficha-field-label">Luva Kalpur</span>
                <span className="ficha-field-value">{ficha.luva_kalpur || '-'}</span>
              </div>
            )}
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

      {/* Histórico de Reprovações */}
      {reprovacoes && reprovacoes.length > 0 && (
        <div className="card ficha-section" id="historico">
          <div className="card-header">
            <h2 style={{ color: '#ef4444' }}>
              <XCircle size={18} /> Histórico de Reprovações ({reprovacoes.length})
            </h2>
          </div>
          <div className="card-body">
            <HistoricoReprovacoes reprovacoes={reprovacoes} />
          </div>
        </div>
      )}

      {/* Modal de Reprovação */}
      {showReprovacaoModal && (
        <ModalReprovacao 
          ficha={ficha}
          onClose={() => setShowReprovacaoModal(false)}
          onSuccess={() => {
            loadFicha();
            loadReprovacoes();
          }}
        />
      )}
    </div>
  );
};

export default FichaDetails;
