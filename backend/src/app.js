const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const routes = require('./routes');

const app = express();

// Segurança
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rotas
app.use('/api', routes);

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Tamanho máximo: 5MB' });
    }
    return res.status(400).json({ error: 'Erro no upload do arquivo' });
  }
  
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ 
      error: 'Erro de validação',
      details: err.errors.map(e => e.message)
    });
  }

  return res.status(500).json({ error: 'Erro interno do servidor' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

module.exports = app;
