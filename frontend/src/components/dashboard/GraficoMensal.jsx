import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const GraficoMensal = ({ dados }) => {
  if (!dados || dados.length === 0) {
    return (
      <div className="chart-empty">
        <p>Sem dados para exibir</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={dados}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="nome" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="criadas" name="Criadas" fill="#2563eb" />
        <Bar dataKey="aprovadas" name="Aprovadas" fill="#22c55e" />
        <Bar dataKey="reprovadas" name="Reprovações" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default GraficoMensal;
