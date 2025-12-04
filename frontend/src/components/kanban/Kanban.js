import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { format, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, AlertTriangle, Eye } from 'lucide-react';

const ETAPAS_ORDER = ['criacao', 'modelacao', 'moldagem', 'fusao', 'rebarbacao', 'inspecao', 'usinagem', 'aprovado'];

const Kanban = () => {
  const navigate = useNavigate();
  const { canMoveFicha } = useAuth();
  const [kanban, setKanban] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKanban();
    const interval = setInterval(loadKanban, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadKanban = async () => {
    try {
      const response = await api.get('/fichas/kanban');
      setKanban(response.data);
    } catch (error) {
      toast.error('Erro ao carregar Kanban');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    if (!canMoveFicha()) {
      toast.warning('Você não tem permissão para mover fichas');
      return;
    }

    const fichaId = parseInt(draggableId.replace('ficha-', ''), 10);
    const etapaDestino = destination.droppableId;

    try {
      await api.post(`/fichas/${fichaId}/mover`, {
        etapa_destino: etapaDestino
      });
      toast.success('Ficha movida com sucesso!');
      loadKanban();
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao mover ficha';
      toast.error(message);
    }
  };

  const isLate = (prazoFinal) => {
    return prazoFinal && isPast(parseISO(prazoFinal));
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return format(parseISO(date), "dd/MM/yyyy", { locale: ptBR });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando Kanban...</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="kanban-container">
        {ETAPAS_ORDER.map((etapaKey) => {
          const etapa = kanban[etapaKey];
          if (!etapa) return null;

          return (
            <div key={etapaKey} className="kanban-column">
              <div className="kanban-column-header">
                <h3>{etapa.nome}</h3>
                <span className="kanban-column-count">{etapa.fichas?.length || 0}</span>
              </div>

              <Droppable droppableId={etapaKey}>
                {(provided, snapshot) => (
                  <div 
                    className="kanban-column-content"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      backgroundColor: snapshot.isDraggingOver ? '#e2e8f0' : undefined
                    }}
                  >
                    {etapa.fichas?.map((ficha, index) => (
                      <Draggable 
                        key={ficha.id} 
                        draggableId={`ficha-${ficha.id}`} 
                        index={index}
                        isDragDisabled={!canMoveFicha()}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`kanban-card ${snapshot.isDragging ? 'dragging' : ''} ${ficha.atrasada ? 'atrasada' : ''}`}
                            onClick={() => navigate(`/fichas/${ficha.id}`)}
                          >
                            <div className="kanban-card-header">
                              <span className="kanban-card-code">{ficha.codigo}</span>
                              {ficha.atrasada || isLate(ficha.prazo_final) ? (
                                <span className="kanban-card-badge badge-atrasada">
                                  <AlertTriangle size={10} /> ATRASADA
                                </span>
                              ) : (
                                <span className="kanban-card-badge badge-normal">
                                  NO PRAZO
                                </span>
                              )}
                            </div>
                            <div className="kanban-card-info">
                              <strong>Material:</strong> {ficha.material}
                            </div>
                            <div className="kanban-card-info">
                              <strong>Projetista:</strong> {ficha.projetista}
                            </div>
                            <div className={`kanban-card-deadline ${isLate(ficha.prazo_final) ? 'deadline-late' : ''}`}>
                              <Clock size={12} />
                              Prazo: {formatDate(ficha.prazo_final)}
                            </div>
                            <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                              <button 
                                className="btn btn-sm btn-outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/fichas/${ficha.id}`);
                                }}
                              >
                                <Eye size={14} /> Ver
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {(!etapa.fichas || etapa.fichas.length === 0) && (
                      <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                        Nenhuma ficha
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default Kanban;
