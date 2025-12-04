const PDFDocument = require('pdfkit');
const { Ficha, CaixaMacho, MoldeArvore, Usuario, Movimentacao } = require('../models');

class PDFService {
  async gerarPDFFicha(fichaId) {
    const ficha = await Ficha.findByPk(fichaId, {
      include: [
        { model: CaixaMacho, as: 'caixas_macho', order: [['ordem', 'ASC']] },
        { model: MoldeArvore, as: 'moldes_arvore', order: [['ordem', 'ASC']] },
        { model: Usuario, as: 'criador', attributes: ['id', 'nome'] },
        { 
          model: Movimentacao, 
          as: 'movimentacoes',
          include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nome'] }],
          order: [['data_movimentacao', 'DESC']]
        }
      ]
    });

    if (!ficha) {
      throw new Error('Ficha não encontrada');
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          margin: 40,
          size: 'A4'
        });
        
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Cabeçalho
        doc.fontSize(16).font('Helvetica-Bold')
           .text('FICHA DE APROVAÇÃO DE PEÇA EM PROCESSO', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica')
           .text(`RQ-24 - ${ficha.codigo}`, { align: 'center' });
        doc.moveDown();

        // Linha divisória
        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown();

        // Status
        const statusColor = ficha.atrasada ? '#ff0000' : '#008000';
        doc.fontSize(10).font('Helvetica-Bold')
           .fillColor(statusColor)
           .text(`Status: ${ficha.etapa_atual.toUpperCase()}${ficha.atrasada ? ' - ATRASADA' : ''}`, { align: 'right' });
        doc.fillColor('#000000');
        doc.moveDown();

        // Seção: Dados Iniciais
        this.addSection(doc, 'DADOS INICIAIS');
        this.addField(doc, 'Projetista', ficha.projetista);
        this.addField(doc, 'Quantidade Amostra', ficha.quantidade_amostra.toString());
        this.addField(doc, 'Material', ficha.material);
        this.addField(doc, 'Peso da Peça', `${ficha.peso_peca} kg`);
        this.addField(doc, 'Nº Peças por Molde', ficha.numero_pecas_molde.toString());
        this.addField(doc, 'Processo de Moldagem', ficha.processo_moldagem);
        
        if (ficha.processo_moldagem === 'JOB') {
          this.addField(doc, 'Dimensão Lado Extração', ficha.dimensao_lado_extracao || '-');
          this.addField(doc, 'Dimensão Lado Fixo', ficha.dimensao_lado_fixo || '-');
          this.addField(doc, 'Extratores', ficha.extratores || '-');
        }

        this.addField(doc, 'Prazo Final', new Date(ficha.prazo_final).toLocaleDateString('pt-BR'));
        this.addField(doc, 'Peso Molde de Areia', `${ficha.peso_molde_areia} kg`);
        this.addField(doc, 'Peso da Árvore', `${ficha.peso_arvore} kg`);
        doc.moveDown();

        // Seção: Campos Calculados
        this.addSection(doc, 'CAMPOS CALCULADOS');
        this.addField(doc, 'RAM', ficha.ram ? ficha.ram.toFixed(3) : '-');
        this.addField(doc, 'RM', ficha.rm ? `${ficha.rm.toFixed(2)}%` : '-');
        doc.moveDown();

        // Seção: Dados da Ferramenta
        this.addSection(doc, 'DADOS DA FERRAMENTA');
        this.addField(doc, 'Qtd. Figuras na Ferramenta', ficha.quantidade_figuras_ferramenta.toString());
        this.addField(doc, 'Material da Ferramenta', ficha.material_ferramenta);
        doc.moveDown();

        // Seção: Caixas de Macho
        if (ficha.caixas_macho && ficha.caixas_macho.length > 0) {
          this.addSection(doc, 'CAIXAS DE MACHO');
          ficha.caixas_macho.forEach((caixa, index) => {
            doc.fontSize(10).font('Helvetica-Bold')
               .text(`Caixa ${index + 1}:`);
            this.addField(doc, '  Nº Machos/Peça', caixa.numero_machos_peca.toString());
            this.addField(doc, '  Nº Figuras', caixa.numero_figuras_caixa_macho.toString());
            this.addField(doc, '  Peso do Macho', `${caixa.peso_macho} kg`);
            this.addField(doc, '  Processo', caixa.processo);
            this.addField(doc, '  Qualidade Areia', caixa.qualidade_areia_macho);
            this.addField(doc, '  Pintura', caixa.possui_pintura_macho ? 
              `Sim (${caixa.tipo_pintura_macho})` : 'Não');
          });
          doc.moveDown();
        }

        // Seção: Moldes de Árvore
        if (ficha.moldes_arvore && ficha.moldes_arvore.length > 0) {
          this.addSection(doc, 'MOLDES DE ÁRVORE');
          ficha.moldes_arvore.forEach((molde, index) => {
            const status = molde.qualidade_aprovada === null ? 'Pendente' :
                          molde.qualidade_aprovada ? 'Aprovado' : 'Reprovado';
            doc.fontSize(10).font('Helvetica')
               .text(`  Molde ${molde.numero_molde}: ${status}`);
          });
          doc.moveDown();
        }

        // Seção: Outros Dados
        this.addSection(doc, 'OUTROS DADOS');
        this.addField(doc, 'Posição de Vazamento', ficha.posicao_vazamento);
        this.addField(doc, 'Resfriadores', ficha.possui_resfriadores ? 
          `Sim (${ficha.quantidade_resfriadores})` : 'Não');
        this.addField(doc, 'Lateral de Aço', ficha.lateral_aco || '-');
        this.addField(doc, 'Luva Kalpur', ficha.luva_kalpur || '-');
        this.addField(doc, 'Trat. Térmico Peça Bruta', ficha.tratamento_termico_peca_bruta || '-');
        this.addField(doc, 'Possui Usinagem', ficha.possui_usinagem ? 'Sim' : 'Não');
        this.addField(doc, 'Possui Pintura', ficha.possui_pintura ? 'Sim' : 'Não');
        this.addField(doc, 'Trat. Térmico Após Usinagem', ficha.tratamento_termico_apos_usinagem || '-');
        this.addField(doc, 'Tratamento Superficial', ficha.tratamento_superficial || '-');
        this.addField(doc, 'Possui Retífica', ficha.possui_retifica ? 'Sim' : 'Não');
        doc.moveDown();

        // Seção: Histórico de Movimentações
        if (ficha.movimentacoes && ficha.movimentacoes.length > 0) {
          // Nova página se necessário
          if (doc.y > 650) {
            doc.addPage();
          }
          
          this.addSection(doc, 'HISTÓRICO DE MOVIMENTAÇÕES');
          ficha.movimentacoes.slice(0, 10).forEach(mov => {
            const data = new Date(mov.data_movimentacao).toLocaleString('pt-BR');
            doc.fontSize(9).font('Helvetica')
               .text(`${data} - ${mov.etapa_origem} → ${mov.etapa_destino} (${mov.usuario?.nome || 'Sistema'})`);
            if (mov.observacoes) {
              doc.fontSize(8).font('Helvetica-Oblique')
                 .text(`   Obs: ${mov.observacoes}`);
            }
          });
        }

        // Rodapé
        doc.moveDown(2);
        doc.fontSize(8).font('Helvetica')
           .text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
        doc.text(`Criado por: ${ficha.criador?.nome || '-'}`, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  addSection(doc, title) {
    doc.fontSize(11).font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text(title);
    doc.moveTo(40, doc.y).lineTo(200, doc.y).stroke();
    doc.fillColor('#000000');
    doc.moveDown(0.3);
  }

  addField(doc, label, value) {
    doc.fontSize(10).font('Helvetica-Bold').text(label + ': ', { continued: true });
    doc.font('Helvetica').text(value || '-');
  }
}

module.exports = new PDFService();
