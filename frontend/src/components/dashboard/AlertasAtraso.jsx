import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, Eye } from 'lucide-react';

const AlertasAtraso = ({ atrasadas, proximasPrazo }) => {
  const navigate = useNavigate();

  const formatDate = (date) => {
    if (!date) return '-';
    return format(parseISO(date), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <div className="alertas-container">
      {/* Fichas Atrasadas */}
      {atrasadas && atrasadas.length > 0 && (
        <div className="alerta-section alerta-danger">
          <h4>
            <AlertTriangle size={16} /> Fichas Atrasadas ({atrasadas.length})
          </h4>
          <div className="alerta-list">
            {atrasadas.slice(0, 5).map((ficha) => (
              <div key={ficha.id} className="alerta-item">
                <div className="alerta-info">
                  <strong>{ficha.codigo}</strong>
                  <span>Prazo: {formatDate(ficha.prazo_final)}</span>
                  <span className="alerta-dias">{ficha.diasAtraso} dias de atraso</span>
                </div>
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => navigate(`/fichas/${ficha.id}`)}
                >
                  <Eye size={12} />
                </button>
              </div>
            ))}
          </div>
          {atrasadas.length > 5 && (
            <div className="alerta-more">
              +{atrasadas.length - 5} outras fichas atrasadas
            </div>
          )}
        </div>
      )}

      {/* Fichas Próximas do Prazo */}
      {proximasPrazo && proximasPrazo.length > 0 && (
        <div className="alerta-section alerta-warning">
          <h4>
            <AlertTriangle size={16} /> Próximas do Prazo ({proximasPrazo.length})
          </h4>
          <div className="alerta-list">
            {proximasPrazo.slice(0, 5).map((ficha) => (
              <div key={ficha.id} className="alerta-item">
                <div className="alerta-info">
                  <strong>{ficha.codigo}</strong>
                  <span>Prazo: {formatDate(ficha.prazo_final)}</span>
                  <span className="alerta-dias">{ficha.diasRestantes} dias restantes</span>
                </div>
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => navigate(`/fichas/${ficha.id}`)}
                >
                  <Eye size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!atrasadas || atrasadas.length === 0) && (!proximasPrazo || proximasPrazo.length === 0) && (
        <div className="alerta-empty">
          <p>Nenhum alerta no momento</p>
        </div>
      )}
    </div>
  );
};

export default AlertasAtraso;
