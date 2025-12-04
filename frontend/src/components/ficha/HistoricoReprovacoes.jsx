import React from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { XCircle, ArrowRight, Image } from 'lucide-react';

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

const HistoricoReprovacoes = ({ reprovacoes }) => {
  const formatDate = (date) => {
    if (!date) return '-';
    return format(parseISO(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  if (!reprovacoes || reprovacoes.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem' }}>
        <p>Nenhuma reprovação registrada</p>
      </div>
    );
  }

  return (
    <div className="reprovacoes-timeline">
      {reprovacoes.map((reprovacao, index) => (
        <div key={reprovacao.id} className="reprovacao-item">
          <div className="reprovacao-icon">
            <XCircle size={20} color="#ef4444" />
          </div>
          <div className="reprovacao-content">
            <div className="reprovacao-header">
              <span className="reprovacao-numero">Reprovação #{reprovacoes.length - index}</span>
              <span className="reprovacao-data">{formatDate(reprovacao.data_reprovacao)}</span>
            </div>
            
            <div className="reprovacao-etapas">
              <span>{ETAPAS[reprovacao.etapa_reprovacao] || reprovacao.etapa_reprovacao}</span>
              <ArrowRight size={14} />
              <span>{ETAPAS[reprovacao.etapa_retorno] || reprovacao.etapa_retorno}</span>
            </div>

            <div className="reprovacao-motivo">
              <strong>Motivo:</strong> {reprovacao.motivo}
            </div>

            <div className="reprovacao-descricao">
              <strong>Descrição:</strong>
              <p>{reprovacao.descricao}</p>
            </div>

            <div className="reprovacao-usuario">
              <strong>Reprovado por:</strong> {reprovacao.usuario?.nome || '-'}
            </div>

            {reprovacao.imagens && reprovacao.imagens.length > 0 && (
              <div className="reprovacao-imagens">
                <strong><Image size={14} /> Imagens do defeito:</strong>
                <div className="imagens-grid">
                  {reprovacao.imagens.map((img) => (
                    <a 
                      key={img.id} 
                      href={`/uploads/${img.caminho_imagem}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <img 
                        src={`/uploads/${img.caminho_imagem}`} 
                        alt="Imagem do defeito" 
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoricoReprovacoes;
