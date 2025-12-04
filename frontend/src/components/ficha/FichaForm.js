import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { toBooleanSafe, formatDateForInput } from '../../utils/helpers';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';

const processosMoldagem = ['PEPSET', 'COLDBOX', 'MOLDMATIC', 'JOB'];

// Material do Ferramental conforme RQ-24
const materiaisFerramental = [
  'Resina/Madeira',
  'Cibatool/Madeira',
  'Alumínio',
  'Resina/Alumínio',
  'Filamento/Protótipo'
];

// Material da Caixa de Macho conforme RQ-24
const materiaisCaixaMacho = [
  'Alumínio',
  'Cibatool',
  'Madeira'
];

const FichaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);

  const { register, handleSubmit, watch, control, reset, formState: { errors } } = useForm({
    defaultValues: {
      caixas_macho: [],
      moldes_arvore: [],
      luvas_kalpur: []
    }
  });

  const { fields: caixasMacho, append: appendCaixa, remove: removeCaixa } = useFieldArray({
    control,
    name: 'caixas_macho'
  });

  const { fields: moldesArvore, append: appendMolde, remove: removeMolde } = useFieldArray({
    control,
    name: 'moldes_arvore'
  });

  const { fields: luvasKalpur, append: appendLuva, remove: removeLuva } = useFieldArray({
    control,
    name: 'luvas_kalpur'
  });

  const processoMoldagem = watch('processo_moldagem');
  const possuiResfriadores = watch('possui_resfriadores');
  const possuiUsinagem = watch('possui_usinagem');

  const loadFicha = useCallback(async () => {
    try {
      const response = await api.get(`/fichas/${id}`);
      const ficha = response.data;
      
      // Format date for input
      if (ficha.prazo_final) {
        ficha.prazo_final = formatDateForInput(ficha.prazo_final);
      }
      
      reset(ficha);
    } catch (error) {
      toast.error('Erro ao carregar ficha');
      navigate('/fichas');
    } finally {
      setLoadingData(false);
    }
  }, [id, navigate, reset]);

  useEffect(() => {
    if (isEdit) {
      loadFicha();
    }
  }, [isEdit, loadFicha]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Convert boolean strings to actual booleans
      const formData = {
        ...data,
        possui_resfriadores: toBooleanSafe(data.possui_resfriadores),
        possui_usinagem: toBooleanSafe(data.possui_usinagem),
        possui_pintura: toBooleanSafe(data.possui_pintura),
        possui_retifica: toBooleanSafe(data.possui_retifica),
        caixas_macho: data.caixas_macho?.map(caixa => ({
          ...caixa,
          possui_pintura_macho: toBooleanSafe(caixa.possui_pintura_macho)
        }))
      };

      if (isEdit) {
        await api.put(`/fichas/${id}`, formData);
        toast.success('Ficha atualizada com sucesso!');
      } else {
        await api.post('/fichas', formData);
        toast.success('Ficha criada com sucesso!');
      }
      navigate('/fichas');
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao salvar ficha';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando ficha...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* CABEÇALHO - Dados da Ficha */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3>Cabeçalho</h3>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Projetista *</label>
                <input
                  type="text"
                  className={`form-input ${errors.projetista ? 'error' : ''}`}
                  {...register('projetista', { required: 'Campo obrigatório' })}
                />
                {errors.projetista && <span className="form-error">{errors.projetista.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Código da Peça</label>
                <input
                  type="text"
                  className="form-input"
                  {...register('codigo_peca')}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cliente</label>
                <input
                  type="text"
                  className="form-input"
                  {...register('cliente')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantidade de Amostra *</label>
                <input
                  type="number"
                  min="1"
                  className={`form-input ${errors.quantidade_amostra ? 'error' : ''}`}
                  {...register('quantidade_amostra', { required: 'Campo obrigatório', min: 1 })}
                />
                {errors.quantidade_amostra && <span className="form-error">{errors.quantidade_amostra.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Prazo Final *</label>
                <input
                  type="date"
                  className={`form-input ${errors.prazo_final ? 'error' : ''}`}
                  {...register('prazo_final', { required: 'Campo obrigatório' })}
                />
                {errors.prazo_final && <span className="form-error">{errors.prazo_final.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Seguir Norma</label>
                <input
                  type="text"
                  className="form-input"
                  {...register('seguir_norma')}
                  placeholder="Ex: ISO 9001, ASTM..."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Descrição da Peça</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  {...register('descricao_peca')}
                  placeholder="Descreva a peça..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* DADOS GERAIS - Estimado */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3>Dados Gerais (Estimado)</h3>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Material *</label>
                <input
                  type="text"
                  className={`form-input ${errors.material ? 'error' : ''}`}
                  {...register('material', { required: 'Campo obrigatório' })}
                />
                {errors.material && <span className="form-error">{errors.material.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Peso da Peça (kg) *</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  className={`form-input ${errors.peso_peca ? 'error' : ''}`}
                  {...register('peso_peca', { required: 'Campo obrigatório' })}
                />
                {errors.peso_peca && <span className="form-error">{errors.peso_peca.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Nº Peças por Molde *</label>
                <input
                  type="number"
                  min="1"
                  className={`form-input ${errors.numero_pecas_molde ? 'error' : ''}`}
                  {...register('numero_pecas_molde', { required: 'Campo obrigatório', min: 1 })}
                />
                {errors.numero_pecas_molde && <span className="form-error">{errors.numero_pecas_molde.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Processo de Moldagem *</label>
                <select
                  className={`form-select ${errors.processo_moldagem ? 'error' : ''}`}
                  {...register('processo_moldagem', { required: 'Campo obrigatório' })}
                >
                  <option value="">Selecione...</option>
                  {processosMoldagem.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {errors.processo_moldagem && <span className="form-error">{errors.processo_moldagem.message}</span>}
              </div>
            </div>

            {processoMoldagem === 'JOB' && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Dimensão Lado Extração</label>
                  <input
                    type="text"
                    className="form-input"
                    {...register('dimensao_lado_extracao')}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dimensão Lado Fixo</label>
                  <input
                    type="text"
                    className="form-input"
                    {...register('dimensao_lado_fixo')}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Extratores</label>
                  <input
                    type="text"
                    className="form-input"
                    {...register('extratores')}
                  />
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Peso do Molde (kg) *</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  className={`form-input ${errors.peso_molde_areia ? 'error' : ''}`}
                  {...register('peso_molde_areia', { required: 'Campo obrigatório' })}
                />
                {errors.peso_molde_areia && <span className="form-error">{errors.peso_molde_areia.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Peso da Árvore (kg) *</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  className={`form-input ${errors.peso_arvore ? 'error' : ''}`}
                  {...register('peso_arvore', { required: 'Campo obrigatório' })}
                />
                {errors.peso_arvore && <span className="form-error">{errors.peso_arvore.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Peso Canal com Cubeta/Kalpur (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  className="form-input"
                  {...register('peso_canal_cubeta_estimado')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nº de Moldes da Árvore</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  {...register('numero_moldes_arvore_estimado')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dados da Ferramenta (Modelação) */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3>Dados da Ferramenta (Modelação)</h3>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Qtd. Figuras na Ferramenta *</label>
                <input
                  type="number"
                  min="1"
                  className={`form-input ${errors.quantidade_figuras_ferramenta ? 'error' : ''}`}
                  {...register('quantidade_figuras_ferramenta', { required: 'Campo obrigatório', min: 1 })}
                />
                {errors.quantidade_figuras_ferramenta && <span className="form-error">{errors.quantidade_figuras_ferramenta.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Material do Ferramental *</label>
                <select
                  className={`form-select ${errors.material_ferramenta ? 'error' : ''}`}
                  {...register('material_ferramenta', { required: 'Campo obrigatório' })}
                >
                  <option value="">Selecione...</option>
                  {materiaisFerramental.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {errors.material_ferramenta && <span className="form-error">{errors.material_ferramenta.message}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Caixas de Macho */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3>Caixas de Macho</h3>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => appendCaixa({
                numero_machos_peca: '',
                numero_figuras_caixa_macho: '',
                material_caixa_macho: '',
                peso_caixa_macho: '',
                peso_macho: '',
                processo: '',
                qualidade_areia_macho: '',
                producao_machos_hora: '',
                possui_pintura_macho: false,
                tipo_pintura_macho: null
              })}
            >
              <Plus size={16} /> Adicionar Caixa
            </button>
          </div>
          <div className="card-body">
            {caixasMacho.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center' }}>
                Nenhuma caixa de macho adicionada
              </p>
            ) : (
              caixasMacho.map((field, index) => (
                <div key={field.id} className="dynamic-field-item">
                  <div className="dynamic-field-item-header">
                    <strong>Caixa de Macho {String.fromCharCode(65 + index)}</strong>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeCaixa(index)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Material da Caixa</label>
                      <select
                        className="form-select"
                        {...register(`caixas_macho.${index}.material_caixa_macho`)}
                      >
                        <option value="">Selecione...</option>
                        {materiaisCaixaMacho.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Peso da Caixa (kg)</label>
                      <input
                        type="number"
                        step="0.001"
                        className="form-input"
                        {...register(`caixas_macho.${index}.peso_caixa_macho`)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nº Machos/Peça</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        {...register(`caixas_macho.${index}.numero_machos_peca`, { required: true })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Nº Figuras Caixa</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        {...register(`caixas_macho.${index}.numero_figuras_caixa_macho`, { required: true })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Peso do Macho (kg)</label>
                      <input
                        type="number"
                        step="0.001"
                        className="form-input"
                        {...register(`caixas_macho.${index}.peso_macho`, { required: true })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Produção Machos/Hora</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        {...register(`caixas_macho.${index}.producao_machos_hora`)}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Processo</label>
                      <input
                        type="text"
                        className="form-input"
                        {...register(`caixas_macho.${index}.processo`, { required: true })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Qualidade Areia</label>
                      <input
                        type="text"
                        className="form-input"
                        {...register(`caixas_macho.${index}.qualidade_areia_macho`, { required: true })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Pintura no Macho?</label>
                      <select
                        className="form-select"
                        {...register(`caixas_macho.${index}.possui_pintura_macho`)}
                      >
                        <option value="false">Não</option>
                        <option value="true">Sim</option>
                      </select>
                    </div>
                    {watch(`caixas_macho.${index}.possui_pintura_macho`) === 'true' && (
                      <div className="form-group">
                        <label className="form-label">Tipo Pintura</label>
                        <select
                          className="form-select"
                          {...register(`caixas_macho.${index}.tipo_pintura_macho`)}
                        >
                          <option value="">Selecione...</option>
                          <option value="lavagem">Lavagem</option>
                          <option value="spray">Spray</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Moldes de Árvore */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3>Moldes de Árvore</h3>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => appendMolde({
                numero_molde: '',
                observacoes: ''
              })}
            >
              <Plus size={16} /> Adicionar Molde
            </button>
          </div>
          <div className="card-body">
            {moldesArvore.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center' }}>
                Nenhum molde de árvore adicionado
              </p>
            ) : (
              moldesArvore.map((field, index) => (
                <div key={field.id} className="dynamic-field-item">
                  <div className="dynamic-field-item-header">
                    <strong>Molde {index + 1}</strong>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeMolde(index)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Número do Molde</label>
                      <input
                        type="text"
                        className="form-input"
                        {...register(`moldes_arvore.${index}.numero_molde`, { required: true })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Observações</label>
                      <input
                        type="text"
                        className="form-input"
                        {...register(`moldes_arvore.${index}.observacoes`)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Luvas / Kalpur */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3>Luvas / Kalpur</h3>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => appendLuva({
                quantidade: '',
                descricao: '',
                peso_kg: ''
              })}
            >
              <Plus size={16} /> Adicionar Luva/Kalpur
            </button>
          </div>
          <div className="card-body">
            {luvasKalpur.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center' }}>
                Nenhuma luva/kalpur adicionada
              </p>
            ) : (
              luvasKalpur.map((field, index) => (
                <div key={field.id} className="dynamic-field-item">
                  <div className="dynamic-field-item-header">
                    <strong>Luva/Kalpur {index + 1}</strong>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeLuva(index)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Quantidade</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        {...register(`luvas_kalpur.${index}.quantidade`, { required: true })}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 2 }}>
                      <label className="form-label">Descrição</label>
                      <input
                        type="text"
                        className="form-input"
                        {...register(`luvas_kalpur.${index}.descricao`)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Peso (kg)</label>
                      <input
                        type="number"
                        step="0.001"
                        className="form-input"
                        {...register(`luvas_kalpur.${index}.peso_kg`)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Outros Campos - Moldagem */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3>Moldagem - Outros Dados</h3>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Posição de Vazamento *</label>
                <select
                  className={`form-select ${errors.posicao_vazamento ? 'error' : ''}`}
                  {...register('posicao_vazamento', { required: 'Campo obrigatório' })}
                >
                  <option value="">Selecione...</option>
                  <option value="Vertical">Vertical</option>
                  <option value="Horizontal">Horizontal</option>
                </select>
                {errors.posicao_vazamento && <span className="form-error">{errors.posicao_vazamento.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Possui Resfriadores?</label>
                <select
                  className="form-select"
                  {...register('possui_resfriadores')}
                >
                  <option value="false">Não</option>
                  <option value="true">Sim</option>
                </select>
              </div>

              {(possuiResfriadores === 'true' || possuiResfriadores === true) && (
                <div className="form-group">
                  <label className="form-label">Quantos Resfriadores?</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    {...register('quantidade_resfriadores')}
                  />
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Lateral de Aço</label>
                <input
                  type="text"
                  className="form-input"
                  {...register('lateral_aco')}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Luva Kalpur</label>
                <input
                  type="text"
                  className="form-input"
                  {...register('luva_kalpur')}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Trat. Térmico Peça Bruta</label>
                <input
                  type="text"
                  className="form-input"
                  {...register('tratamento_termico_peca_bruta')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Possui Usinagem?</label>
                <select
                  className="form-select"
                  {...register('possui_usinagem')}
                >
                  <option value="false">Não</option>
                  <option value="true">Sim</option>
                </select>
                <small style={{ color: '#64748b', fontSize: '0.75rem' }}>
                  {(possuiUsinagem === 'false' || possuiUsinagem === false) 
                    ? 'Ficha será aprovada diretamente após inspeção' 
                    : 'Ficha passará pela etapa de usinagem'}
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Possui Pintura?</label>
                <select
                  className="form-select"
                  {...register('possui_pintura')}
                >
                  <option value="false">Não</option>
                  <option value="true">Sim</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Possui Retífica?</label>
                <select
                  className="form-select"
                  {...register('possui_retifica')}
                >
                  <option value="false">Não</option>
                  <option value="true">Sim</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Trat. Térmico Após Usinagem</label>
                <input
                  type="text"
                  className="form-input"
                  {...register('tratamento_termico_apos_usinagem')}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tratamento Superficial</label>
                <input
                  type="text"
                  className="form-input"
                  {...register('tratamento_superficial')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            <Save size={16} />
            {loading ? 'Salvando...' : isEdit ? 'Atualizar' : 'Criar Ficha'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FichaForm;
