import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye } from 'lucide-react';

const TabelaRecentes = ({ dados }) => {
  const navigate = useNavigate();

  const formatDate = (date) => {
    if (!date) return '-';
    return format(parseISO(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  if (!dados || dados.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem' }}>
        <p>Nenhuma movimentação recente</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Nº Ficha</th>
            <th>Projetista</th>
            <th>Etapa Atual</th>
            <th>Status</th>
            <th>Data Movimentação</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((item) => (
            <tr key={item.id}>
              <td>
                <strong style={{ color: '#2563eb' }}>{item.ficha?.codigo || '-'}</strong>
              </td>
              <td>{item.ficha?.projetista || '-'}</td>
              <td>{item.etapa_nome}</td>
              <td>
                {item.ficha?.atrasada ? (
                  <span className="badge badge-atrasada">ATRASADA</span>
                ) : item.ficha?.status === 'aprovada' ? (
                  <span className="badge badge-normal">APROVADA</span>
                ) : (
                  <span className="badge" style={{ backgroundColor: '#f59e0b', color: 'white' }}>EM ANDAMENTO</span>
                )}
              </td>
              <td>{formatDate(item.data_movimentacao)}</td>
              <td>
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => navigate(`/fichas/${item.ficha?.id}`)}
                  disabled={!item.ficha?.id}
                >
                  <Eye size={14} /> Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TabelaRecentes;
