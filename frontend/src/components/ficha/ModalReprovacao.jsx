import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { XCircle, Upload, X, AlertTriangle } from 'lucide-react';

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

const ModalReprovacao = ({ ficha, onClose, onSuccess }) => {
  const [motivo, setMotivo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [imagens, setImagens] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMotivos();
  }, []);

  const loadMotivos = async () => {
    try {
      const response = await api.get('/fichas/motivos-reprovacao');
      setMotivos(response.data);
    } catch (error) {
      console.error('Erro ao carregar motivos:', error);
      // Fallback motivos
      setMotivos([
        'Defeito dimensional',
        'Defeito superficial',
        'Porosidade',
        'Trinca',
        'Inclusão',
        'Material incorreto',
        'Rechupe',
        'Outro'
      ]);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('imagem', file);
      formData.append('ficha_id', ficha.id);
      formData.append('etapa', 'reprovacao');
      
      try {
        const response = await api.post('/imagens/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setImagens(prev => [...prev, response.data.caminho]);
      } catch (error) {
        toast.error('Erro ao fazer upload da imagem');
      }
    }
  };

  const removeImage = (index) => {
    setImagens(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!motivo || !descricao) {
      toast.warning('Preencha todos os campos obrigatórios');
      return;
    }

    setSubmitting(true);

    try {
      await api.post(`/fichas/${ficha.id}/reprovar`, {
        motivo,
        descricao,
        imagens
      });

      toast.success('Ficha reprovada e movida para a aba "Reprovados"');
      onSuccess?.();
      onClose();
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao reprovar ficha';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ backgroundColor: '#fef2f2' }}>
          <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <XCircle size={20} /> Reprovar Ficha {ficha.codigo}
          </h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ 
              padding: '0.75rem 1rem',
              backgroundColor: '#fef9c3',
              borderRadius: '0.375rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={20} color="#ca8a04" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ color: '#854d0e', fontSize: '0.875rem' }}>
                <strong>Atenção:</strong> A ficha será movida para a aba "Reprovados" e removida do Kanban.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Etapa Atual</label>
              <input
                type="text"
                className="form-input"
                value={ETAPAS[ficha.etapa_atual] || ficha.etapa_atual}
                disabled
                style={{ backgroundColor: '#f1f5f9' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Motivo da Reprovação *</label>
              <select
                className="form-select"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                required
              >
                <option value="">Selecione o motivo</option>
                {motivos.map((m, index) => (
                  <option key={index} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Descrição Detalhada *</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva detalhadamente o problema encontrado..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Anexar Imagens do Defeito</label>
              <div className="file-upload-container">
                <input
                  type="file"
                  id="imagem-upload"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="imagem-upload" className="btn btn-outline">
                  <Upload size={16} /> Adicionar Imagens
                </label>
              </div>
              
              {imagens.length > 0 && (
                <div className="image-preview-container">
                  {imagens.map((img, index) => {
                    // Sanitize the image path to prevent XSS
                    const sanitizedPath = encodeURIComponent(img).replace(/%2F/g, '/');
                    return (
                      <div key={index} className="image-preview">
                        <img src={`/uploads/${sanitizedPath}`} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          className="image-remove"
                          onClick={() => removeImage(index)}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-danger"
              disabled={submitting || !motivo || !descricao}
            >
              {submitting ? 'Reprovando...' : 'Confirmar Reprovação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalReprovacao;
