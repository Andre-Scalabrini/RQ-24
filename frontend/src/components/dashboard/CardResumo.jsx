import React from 'react';
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

const CardResumo = ({ titulo, valor, icone, cor, subtitulo }) => {
  const getIcon = () => {
    const iconProps = { size: 24, color: cor || '#2563eb' };
    switch (icone) {
      case 'total':
        return <FileText {...iconProps} />;
      case 'aprovadas':
        return <CheckCircle {...iconProps} />;
      case 'reprovadas':
        return <XCircle {...iconProps} />;
      case 'atrasadas':
        return <Clock {...iconProps} />;
      default:
        return <FileText {...iconProps} />;
    }
  };

  return (
    <div className="dashboard-card">
      <div className="dashboard-card-icon" style={{ backgroundColor: `${cor}20` }}>
        {getIcon()}
      </div>
      <div className="dashboard-card-content">
        <span className="dashboard-card-title">{titulo}</span>
        <span className="dashboard-card-value" style={{ color: cor }}>{valor}</span>
        {subtitulo && <span className="dashboard-card-subtitle">{subtitulo}</span>}
      </div>
    </div>
  );
};

export default CardResumo;
