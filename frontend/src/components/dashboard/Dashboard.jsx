import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import CardResumo from './CardResumo';
import GraficoEtapas from './GraficoEtapas';
import GraficoMensal from './GraficoMensal';
import TabelaRecentes from './TabelaRecentes';
import AlertasAtraso from './AlertasAtraso';
import { RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [resumo, setResumo] = useState({
    totalFichas: 0,
    aprovadas: 0,
    reprovadas: 0,
    atrasadas: 0,
    taxaAprovacao: 0,
    taxaReprovacao: 0,
    tempoMedioAprovacao: 0
  });
  const [dadosEtapas, setDadosEtapas] = useState([]);
  const [dadosMensal, setDadosMensal] = useState([]);
  const [fichasRecentes, setFichasRecentes] = useState([]);
  const [fichasAtrasadas, setFichasAtrasadas] = useState([]);
  const [fichasProximasPrazo, setFichasProximasPrazo] = useState([]);
  const [periodo, setPeriodo] = useState('30dias');

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      
      const [
        resumoRes,
        etapasRes,
        mensalRes,
        recentesRes,
        atrasadasRes,
        proximasRes
      ] = await Promise.all([
        api.get(`/dashboard/resumo?periodo=${periodo}`),
        api.get('/dashboard/graficos/etapas'),
        api.get('/dashboard/graficos/mensal'),
        api.get('/dashboard/fichas-recentes?limite=10'),
        api.get('/dashboard/fichas-atrasadas'),
        api.get('/dashboard/fichas-proximas-prazo')
      ]);

      setResumo(resumoRes.data);
      setDadosEtapas(etapasRes.data);
      setDadosMensal(mensalRes.data);
      setFichasRecentes(recentesRes.data);
      setFichasAtrasadas(atrasadasRes.data);
      setFichasProximasPrazo(proximasRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dashboard');
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header with filters */}
      <div className="dashboard-header">
        <div className="dashboard-filters">
          <select 
            className="form-select"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="hoje">Hoje</option>
            <option value="7dias">Últimos 7 dias</option>
            <option value="30dias">Último mês</option>
            <option value="">Todo o período</option>
          </select>
        </div>
        <button className="btn btn-outline" onClick={loadDashboard}>
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-cards">
        <CardResumo 
          titulo="Total de Fichas" 
          valor={resumo.totalFichas} 
          icone="total" 
          cor="#2563eb" 
        />
        <CardResumo 
          titulo="Aprovadas" 
          valor={resumo.aprovadas} 
          icone="aprovadas" 
          cor="#22c55e"
          subtitulo={`Taxa: ${resumo.taxaAprovacao}%`}
        />
        <CardResumo 
          titulo="Reprovadas" 
          valor={resumo.reprovadas} 
          icone="reprovadas" 
          cor="#ef4444"
          subtitulo={`Taxa: ${resumo.taxaReprovacao}%`}
        />
        <CardResumo 
          titulo="Atrasadas" 
          valor={resumo.atrasadas} 
          icone="atrasadas" 
          cor="#f59e0b" 
        />
      </div>

      {/* Metrics Row */}
      <div className="dashboard-metrics">
        <div className="metric-card">
          <span className="metric-label">Tempo Médio de Aprovação</span>
          <span className="metric-value">{resumo.tempoMedioAprovacao} dias</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Taxa de Aprovação</span>
          <span className="metric-value" style={{ color: '#22c55e' }}>{resumo.taxaAprovacao}%</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Taxa de Reprovação</span>
          <span className="metric-value" style={{ color: '#ef4444' }}>{resumo.taxaReprovacao}%</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="dashboard-charts">
        <div className="card">
          <div className="card-header">
            <h3>Fichas por Etapa</h3>
          </div>
          <div className="card-body">
            <GraficoEtapas dados={dadosEtapas} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3>Evolução Mensal</h3>
          </div>
          <div className="card-body">
            <GraficoMensal dados={dadosMensal} />
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="dashboard-bottom">
        {/* Recent Fichas */}
        <div className="card" style={{ flex: 2 }}>
          <div className="card-header">
            <h3>Movimentações Recentes</h3>
          </div>
          <div className="card-body">
            <TabelaRecentes dados={fichasRecentes} />
          </div>
        </div>

        {/* Alerts */}
        <div className="card" style={{ flex: 1 }}>
          <div className="card-header">
            <h3>Alertas</h3>
          </div>
          <div className="card-body">
            <AlertasAtraso 
              atrasadas={fichasAtrasadas} 
              proximasPrazo={fichasProximasPrazo} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
