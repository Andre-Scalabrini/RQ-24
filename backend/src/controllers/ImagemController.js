const { Imagem, Ficha, Usuario } = require('../models');
const fs = require('fs');
const path = require('path');

class ImagemController {
  async index(req, res) {
    try {
      const { fichaId } = req.params;

      const imagens = await Imagem.findAll({
        where: { ficha_id: fichaId },
        include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nome'] }],
        order: [['created_at', 'DESC']]
      });

      return res.json(imagens);
    } catch (error) {
      console.error('Erro ao listar imagens:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async store(req, res) {
    try {
      const { fichaId } = req.params;
      const { etapa, descricao } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      const ficha = await Ficha.findByPk(fichaId);

      if (!ficha) {
        // Remover arquivo se ficha não existe
        if (req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ error: 'Ficha não encontrada' });
      }

      const imagem = await Imagem.create({
        ficha_id: fichaId,
        usuario_id: req.usuarioId,
        etapa: etapa || ficha.etapa_atual,
        nome_arquivo: req.file.originalname,
        caminho: req.file.path,
        tipo_mime: req.file.mimetype,
        tamanho: req.file.size,
        descricao
      });

      const imagemCompleta = await Imagem.findByPk(imagem.id, {
        include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nome'] }]
      });

      return res.status(201).json(imagemCompleta);
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      // Remover arquivo em caso de erro
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {
          // Ignorar erro ao deletar arquivo
        }
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;

      const imagem = await Imagem.findByPk(id);

      if (!imagem) {
        return res.status(404).json({ error: 'Imagem não encontrada' });
      }

      // Remover arquivo físico
      if (fs.existsSync(imagem.caminho)) {
        fs.unlinkSync(imagem.caminho);
      }

      await imagem.destroy();

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir imagem:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async download(req, res) {
    try {
      const { id } = req.params;

      const imagem = await Imagem.findByPk(id);

      if (!imagem) {
        return res.status(404).json({ error: 'Imagem não encontrada' });
      }

      if (!fs.existsSync(imagem.caminho)) {
        return res.status(404).json({ error: 'Arquivo não encontrado' });
      }

      return res.download(imagem.caminho, imagem.nome_arquivo);
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new ImagemController();
