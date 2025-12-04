import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const GraficoEtapas = ({ dados }) => {
  if (!dados || dados.length === 0) {
    return (
      <div className="chart-empty">
        <p>Sem dados para exibir</p>
      </div>
    );
  }

  // Filter only stages with fichas
  const dadosFiltrados = dados.filter(d => d.quantidade > 0);

  if (dadosFiltrados.length === 0) {
    return (
      <div className="chart-empty">
        <p>Nenhuma ficha em andamento</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={dadosFiltrados}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ nome, quantidade, percent }) => 
            `${nome}: ${quantidade} (${(percent * 100).toFixed(0)}%)`
          }
          outerRadius={80}
          fill="#8884d8"
          dataKey="quantidade"
          nameKey="nome"
        >
          {dadosFiltrados.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value, name) => [`${value} fichas`, name]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default GraficoEtapas;
