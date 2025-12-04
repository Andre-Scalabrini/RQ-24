const app = require('./app');
const { sequelize, Setor, Usuario } = require('./models');
const bcrypt = require('bcryptjs');

const PORT = process.env.PORT || 3001;

// Dados iniciais
const setoresIniciais = [
  { nome: 'Modelação', ordem: 1, descricao: 'Setor de Modelação' },
  { nome: 'Moldagem', ordem: 2, descricao: 'Setor de Moldagem' },
  { nome: 'Fusão', ordem: 3, descricao: 'Setor de Fusão' },
  { nome: 'Rebarbação', ordem: 4, descricao: 'Setor de Rebarbação' },
  { nome: 'Inspeção', ordem: 5, descricao: 'Setor de Inspeção' },
  { nome: 'Usinagem', ordem: 6, descricao: 'Setor de Usinagem' }
];

const criarDadosIniciais = async () => {
  try {
    // Criar setores
    for (const setor of setoresIniciais) {
      const [s, created] = await Setor.findOrCreate({
        where: { nome: setor.nome },
        defaults: setor
      });
      if (created) {
        console.log(`Setor criado: ${setor.nome}`);
      }
    }

    // Criar usuário administrador padrão
    const [admin, created] = await Usuario.findOrCreate({
      where: { email: 'admin@empresa.com' },
      defaults: {
        nome: 'Administrador',
        email: 'admin@empresa.com',
        senha: await bcrypt.hash('admin123', 10),
        grupo: 'administrador'
      }
    });

    if (created) {
      console.log('Usuário administrador criado: admin@empresa.com / admin123');
    }
  } catch (error) {
    console.error('Erro ao criar dados iniciais:', error);
  }
};

const iniciarServidor = async () => {
  try {
    // Sincronizar banco de dados
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Banco de dados sincronizado');

    // Criar dados iniciais
    await criarDadosIniciais();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`API disponível em http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

iniciarServidor();
