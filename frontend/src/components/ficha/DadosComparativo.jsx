import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { Save, Calculator, ClipboardList, Edit3 } from 'lucide-react';

const CAMPOS_DADOS = [
  { key: 'material', label: 'Material', type: 'text' },
  { key: 'peso_peca', label: 'Peso da Peça (kg)', type: 'number', step: '0.001' },
  { key: 'numero_pecas_molde', label: 'Nº Peças por Molde', type: 'number' },
  { key: 'peso_molde', label: 'Peso do Molde (kg)', type: 'number', step: '0.001' },
  { key: 'peso_arvore', label: 'Peso da Árvore (kg)', type: 'number', step: '0.001' },
  { key: 'peso_canal_cubeta', label: 'Peso Canal/Kalpur (kg)', type: 'number', step: '0.001' },
  { key: 'numero_moldes_arvore', label: 'Nº Moldes da Árvore', type: 'number' }
];

const DadosComparativo = ({ ficha, etapaAtual, onUpdate }) => {
  const [dadosObtidos, setDadosObtidos] = useState({
    material: '',
    peso_peca: '',
    numero_pecas_molde: '',
    peso_molde: '',
    peso_arvore: '',
    peso_canal_cubeta: '',
    numero_moldes_arvore: ''
  });
  const [ramObtido, setRamObtido] = useState(null);
  const [rmObtido, setRmObtido] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Initialize with existing obtained data
  useEffect(() => {
    if (ficha) {
      setDadosObtidos({
        material: ficha.material_obtido || '',
        peso_peca: ficha.peso_peca_obtido || '',
        numero_pecas_molde: ficha.numero_pecas_molde_obtido || '',
        peso_molde: ficha.peso_molde_obtido || '',
        peso_arvore: ficha.peso_arvore_obtido || '',
        peso_canal_cubeta: ficha.peso_canal_cubeta_obtido || '',
        numero_moldes_arvore: ficha.numero_moldes_arvore_obtido || ''
      });
      setRamObtido(ficha.ram_obtido || null);
      setRmObtido(ficha.rm_obtido || null);
    }
  }, [ficha]);

  // Calculate RAM and RM when data changes
  const calculateMetrics = useCallback(() => {
    const pesoPeca = parseFloat(dadosObtidos.peso_peca) || 0;
    const pesoMolde = parseFloat(dadosObtidos.peso_molde) || 0;
    const pesoArvore = parseFloat(dadosObtidos.peso_arvore) || 0;

    // RAM = peso do molde / peso da peça
    if (pesoPeca > 0 && pesoMolde > 0) {
      setRamObtido((pesoMolde / pesoPeca).toFixed(3));
    } else {
      setRamObtido(null);
    }

    // RM = (peso da peça / peso da árvore) * 100
    if (pesoArvore > 0 && pesoPeca > 0) {
      setRmObtido(((pesoPeca / pesoArvore) * 100).toFixed(2));
    } else {
      setRmObtido(null);
    }
  }, [dadosObtidos.peso_peca, dadosObtidos.peso_molde, dadosObtidos.peso_arvore]);

  useEffect(() => {
    calculateMetrics();
  }, [calculateMetrics]);

  const handleChange = (key, value) => {
    setDadosObtidos(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare data for API
      const updateData = {
        material_obtido: dadosObtidos.material || null,
        peso_peca_obtido: dadosObtidos.peso_peca ? parseFloat(dadosObtidos.peso_peca) : null,
        numero_pecas_molde_obtido: dadosObtidos.numero_pecas_molde ? parseInt(dadosObtidos.numero_pecas_molde, 10) : null,
        peso_molde_obtido: dadosObtidos.peso_molde ? parseFloat(dadosObtidos.peso_molde) : null,
        peso_arvore_obtido: dadosObtidos.peso_arvore ? parseFloat(dadosObtidos.peso_arvore) : null,
        peso_canal_cubeta_obtido: dadosObtidos.peso_canal_cubeta ? parseFloat(dadosObtidos.peso_canal_cubeta) : null,
        numero_moldes_arvore_obtido: dadosObtidos.numero_moldes_arvore ? parseInt(dadosObtidos.numero_moldes_arvore, 10) : null
      };

      await api.put(`/fichas/${ficha.id}`, updateData);
      
      toast.success('Dados obtidos salvos com sucesso!');
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao salvar dados obtidos';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const getEstimatedValue = (key) => {
    // Map to the correct field names in ficha
    const mapping = {
      material: ficha.material_estimado || ficha.material,
      peso_peca: ficha.peso_peca_estimado || ficha.peso_peca,
      numero_pecas_molde: ficha.numero_pecas_molde_estimado || ficha.numero_pecas_molde,
      peso_molde: ficha.peso_molde_estimado || ficha.peso_molde_areia,
      peso_arvore: ficha.peso_arvore_estimado || ficha.peso_arvore,
      peso_canal_cubeta: ficha.peso_canal_cubeta_estimado,
      numero_moldes_arvore: ficha.numero_moldes_arvore_estimado
    };
    return mapping[key] || '-';
  };

  const ramEstimado = ficha.ram_estimado || ficha.ram;
  const rmEstimado = ficha.rm_estimado || ficha.rm;

  return (
    <div className="dados-comparativo">
      <div className="dados-comparativo-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calculator size={18} />
          Dados Estimados vs Obtidos
        </h3>
        {!isEditing ? (
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 size={14} /> Preencher Dados Obtidos
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => setIsEditing(false)}
            >
              Cancelar
            </button>
            <button 
              className="btn btn-success btn-sm"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={14} /> {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}
      </div>

      <div className="dados-comparativo-grid">
        {/* Left Column - Estimated Data (Read-only) */}
        <div className="dados-column dados-estimado">
          <div className="dados-column-header">
            <ClipboardList size={16} />
            <span>📋 DADOS ESTIMADOS</span>
            <small>(Criação da Ficha)</small>
          </div>
          <div className="dados-column-content">
            {CAMPOS_DADOS.map(campo => (
              <div key={campo.key} className="dados-field">
                <label>{campo.label}</label>
                <div className="dados-value readonly">
                  {getEstimatedValue(campo.key)}
                </div>
              </div>
            ))}
            {/* RAM and RM */}
            <div className="dados-field calculated">
              <label>RAM</label>
              <div className="dados-value readonly">
                {ramEstimado ? parseFloat(ramEstimado).toFixed(3) : '-'}
              </div>
            </div>
            <div className="dados-field calculated">
              <label>RM (%)</label>
              <div className="dados-value readonly">
                {rmEstimado ? `${parseFloat(rmEstimado).toFixed(2)}%` : '-'}
              </div>
            </div>
          </div>
          <div className="dados-column-footer">
            <small>(somente leitura)</small>
          </div>
        </div>

        {/* Right Column - Obtained Data (Editable) */}
        <div className="dados-column dados-obtido">
          <div className="dados-column-header">
            <Edit3 size={16} />
            <span>✏️ DADOS OBTIDOS</span>
            <small>(Preencher agora)</small>
          </div>
          <div className="dados-column-content">
            {CAMPOS_DADOS.map(campo => (
              <div key={campo.key} className="dados-field">
                <label>{campo.label}</label>
                {isEditing ? (
                  <input
                    type={campo.type}
                    step={campo.step}
                    className="form-input"
                    value={dadosObtidos[campo.key]}
                    onChange={(e) => handleChange(campo.key, e.target.value)}
                    placeholder={`Valor ${campo.label.toLowerCase()}`}
                  />
                ) : (
                  <div className="dados-value">
                    {dadosObtidos[campo.key] || '-'}
                  </div>
                )}
              </div>
            ))}
            {/* RAM and RM - Auto-calculated */}
            <div className="dados-field calculated">
              <label>RAM <small>(auto-calculado)</small></label>
              <div className="dados-value auto-calc">
                {ramObtido || '-'}
              </div>
            </div>
            <div className="dados-field calculated">
              <label>RM (%) <small>(auto-calculado)</small></label>
              <div className="dados-value auto-calc">
                {rmObtido ? `${rmObtido}%` : '-'}
              </div>
            </div>
          </div>
          <div className="dados-column-footer">
            <small>(campos editáveis)</small>
          </div>
        </div>
      </div>

      <style>{`
        .dados-comparativo {
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          background: #fff;
        }
        .dados-comparativo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 0.5rem 0.5rem 0 0;
        }
        .dados-comparativo-header h3 {
          margin: 0;
          font-size: 1rem;
          color: #1e293b;
        }
        .dados-comparativo-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }
        .dados-column {
          padding: 1rem;
        }
        .dados-estimado {
          background: #f8fafc;
          border-right: 2px solid #e2e8f0;
        }
        .dados-obtido {
          background: #fff;
        }
        .dados-column-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e2e8f0;
          font-weight: 600;
        }
        .dados-column-header small {
          color: #64748b;
          font-weight: 400;
        }
        .dados-column-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .dados-field {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .dados-field label {
          font-size: 0.875rem;
          color: #475569;
          min-width: 150px;
        }
        .dados-field.calculated {
          padding-top: 0.5rem;
          border-top: 1px dashed #e2e8f0;
          margin-top: 0.25rem;
        }
        .dados-field.calculated label small {
          color: #94a3b8;
          display: block;
        }
        .dados-value {
          flex: 1;
          text-align: right;
          font-weight: 500;
        }
        .dados-value.readonly {
          color: #64748b;
        }
        .dados-value.auto-calc {
          color: #2563eb;
          font-weight: 600;
        }
        .dados-field .form-input {
          flex: 1;
          padding: 0.5rem;
          text-align: right;
        }
        .dados-column-footer {
          text-align: center;
          margin-top: 1rem;
          padding-top: 0.5rem;
          border-top: 1px solid #e2e8f0;
        }
        .dados-column-footer small {
          color: #94a3b8;
          font-size: 0.75rem;
        }
        @media (max-width: 768px) {
          .dados-comparativo-grid {
            grid-template-columns: 1fr;
          }
          .dados-estimado {
            border-right: none;
            border-bottom: 2px solid #e2e8f0;
          }
        }
      `}</style>
    </div>
  );
};

export default DadosComparativo;
