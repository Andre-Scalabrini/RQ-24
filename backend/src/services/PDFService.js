const PDFDocument = require('pdfkit');
const { Ficha, CaixaMacho, MoldeArvore, Usuario, Movimentacao } = require('../models');

// Mapeamento de etapas (10 etapas conforme RQ-24 Rev. 06)
const ETAPAS = {
  criacao: 'Criação da Ficha',
  modelacao: 'Modelação',
  moldagem: 'Moldagem',
  fusao: 'Fusão',
  acabamento: 'Acabamento',
  analise_critica: 'Análise Crítica',
  inspecao: 'Inspeção',
  dimensional: 'Dimensional',
  usinagem: 'Usinagem',
  aprovado: 'Aprovado'
};

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
           .text(`RQ-24 Rev. 06 - ${ficha.codigo}`, { align: 'center' });
        doc.moveDown();

        // Linha divisória
        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown();

        // Status
        const statusColor = ficha.atrasada ? '#ff0000' : '#008000';
        const etapaNome = ETAPAS[ficha.etapa_atual] || ficha.etapa_atual;
        doc.fontSize(10).font('Helvetica-Bold')
           .fillColor(statusColor)
           .text(`Status: ${etapaNome.toUpperCase()}${ficha.atrasada ? ' - ATRASADA' : ''}`, { align: 'right' });
        doc.fillColor('#000000');
        doc.moveDown();

        // Seção: Cabeçalho
        this.addSection(doc, 'CABEÇALHO');
        this.addField(doc, 'Projetista', ficha.projetista);
        this.addField(doc, 'Código da Peça', ficha.codigo_peca || '-');
        this.addField(doc, 'Cliente', ficha.cliente || '-');
        this.addField(doc, 'Data', new Date(ficha.createdAt).toLocaleDateString('pt-BR'));
        this.addField(doc, 'Quantidade de Amostra', ficha.quantidade_amostra.toString());
        this.addField(doc, 'Descrição da Peça', ficha.descricao_peca || '-');
        this.addField(doc, 'Prazo', new Date(ficha.prazo_final).toLocaleDateString('pt-BR'));
        this.addField(doc, 'Seguir Norma', ficha.seguir_norma || '-');
        doc.moveDown();

        // Seção: Dados Gerais (Estimado vs Obtido)
        this.addSection(doc, 'DADOS GERAIS');
        
        // Cabeçalho da tabela comparativa
        doc.fontSize(9).font('Helvetica-Bold');
        const startX = 40;
        doc.text('Campo', startX, doc.y, { width: 180, continued: false });
        doc.text('Estimado', startX + 200, doc.y - 12, { width: 100 });
        doc.text('Obtido', startX + 320, doc.y - 12, { width: 100 });
        doc.moveDown(0.3);
        
        // Dados estimados e obtidos
        const material = ficha.material_estimado || ficha.material || '-';
        const materialObt = ficha.material_obtido || '-';
        this.addComparativeField(doc, 'Material', material, materialObt);
        
        const pesoPeca = ficha.peso_peca_estimado || ficha.peso_peca || '-';
        const pesoPecaObt = ficha.peso_peca_obtido || '-';
        this.addComparativeField(doc, 'Peso da Peça (kg)', pesoPeca, pesoPecaObt);
        
        const numPecasMolde = ficha.numero_pecas_molde_estimado || ficha.numero_pecas_molde || '-';
        const numPecasMoldeObt = ficha.numero_pecas_molde_obtido || '-';
        this.addComparativeField(doc, 'Nº Peças/Molde', numPecasMolde, numPecasMoldeObt);
        
        const pesoMolde = ficha.peso_molde_estimado || ficha.peso_molde_areia || '-';
        const pesoMoldeObt = ficha.peso_molde_obtido || '-';
        this.addComparativeField(doc, 'Peso do Molde (kg)', pesoMolde, pesoMoldeObt);
        
        const pesoArvore = ficha.peso_arvore_estimado || ficha.peso_arvore || '-';
        const pesoArvoreObt = ficha.peso_arvore_obtido || '-';
        this.addComparativeField(doc, 'Peso da Árvore (kg)', pesoArvore, pesoArvoreObt);
        
        const ramEst = ficha.ram_estimado || ficha.ram ? parseFloat(ficha.ram_estimado || ficha.ram).toFixed(3) : '-';
        const ramObt = ficha.ram_obtido ? parseFloat(ficha.ram_obtido).toFixed(3) : '-';
        this.addComparativeField(doc, 'RAM', ramEst, ramObt);
        
        const rmEst = ficha.rm_estimado || ficha.rm ? `${parseFloat(ficha.rm_estimado || ficha.rm).toFixed(2)}%` : '-';
        const rmObt = ficha.rm_obtido ? `${parseFloat(ficha.rm_obtido).toFixed(2)}%` : '-';
        this.addComparativeField(doc, 'RM', rmEst, rmObt);
        
        doc.moveDown();

        // Seção: Dados da Ferramenta (Modelação)
        this.addSection(doc, 'MODELAÇÃO - DADOS DA FERRAMENTA');
        this.addField(doc, 'Qtd. Figuras na Ferramenta', ficha.quantidade_figuras_ferramenta?.toString() || '-');
        this.addField(doc, 'Material do Ferramental', ficha.material_ferramenta || '-');
        doc.moveDown();

        // Seção: Caixas de Macho
        if (ficha.caixas_macho && ficha.caixas_macho.length > 0) {
          this.addSection(doc, 'CAIXAS DE MACHO');
          ficha.caixas_macho.forEach((caixa, index) => {
            const identificacao = String.fromCharCode(65 + index); // A, B, C, ...
            doc.fontSize(10).font('Helvetica-Bold')
               .text(`Macho ${identificacao}:`);
            this.addField(doc, '  Material da Caixa', caixa.material_caixa_macho || '-');
            this.addField(doc, '  Peso da Caixa', caixa.peso_caixa_macho ? `${caixa.peso_caixa_macho} kg` : '-');
            this.addField(doc, '  Nº Machos/Peça', caixa.numero_machos_peca.toString());
            this.addField(doc, '  Nº Figuras', caixa.numero_figuras_caixa_macho.toString());
            this.addField(doc, '  Peso do Macho', `${caixa.peso_macho} kg`);
            this.addField(doc, '  Processo', caixa.processo);
            this.addField(doc, '  Qualidade Areia', caixa.qualidade_areia_macho);
            this.addField(doc, '  Produção/Hora', caixa.producao_machos_hora?.toString() || '-');
            this.addField(doc, '  Pintura', caixa.possui_pintura_macho ? 
              `Sim (${caixa.tipo_pintura_macho})` : 'Não');
          });
          doc.moveDown();
        }

        // Seção: Moldagem
        this.addSection(doc, 'MOLDAGEM');
        this.addField(doc, 'Processo de Moldagem', ficha.processo_moldagem || '-');
        
        if (ficha.processo_moldagem === 'JOB') {
          this.addField(doc, 'Dimensão Lado Extração', ficha.dimensao_lado_extracao || '-');
          this.addField(doc, 'Dimensão Lado Fixo', ficha.dimensao_lado_fixo || '-');
          this.addField(doc, 'Extratores', ficha.extratores || '-');
        }
        
        this.addField(doc, 'Posição de Vazamento', ficha.posicao_vazamento || '-');
        this.addField(doc, 'Resfriadores', ficha.possui_resfriadores ? 
          `Sim (${ficha.quantidade_resfriadores})` : 'Não');
        this.addField(doc, 'Lateral de Aço', ficha.lateral_aco || '-');
        this.addField(doc, 'Luva Kalpur', ficha.luva_kalpur || '-');
        doc.moveDown();

        // Seção: Moldes de Árvore (Acabamento)
        if (ficha.moldes_arvore && ficha.moldes_arvore.length > 0) {
          this.addSection(doc, 'ACABAMENTO - MOLDES DE ÁRVORE');
          ficha.moldes_arvore.forEach((molde) => {
            const status = molde.qualidade_aprovada === null ? 'Pendente' :
                          molde.qualidade_aprovada ? 'Aprovado' : 'Reprovado';
            doc.fontSize(10).font('Helvetica')
               .text(`  Molde ${molde.numero_molde}: ${status}`);
          });
          doc.moveDown();
        }

        // Seção: Usinagem
        this.addSection(doc, 'USINAGEM');
        this.addField(doc, 'Possui Usinagem', ficha.possui_usinagem ? 'Sim' : 'Não');
        this.addField(doc, 'Possui Pintura', ficha.possui_pintura ? 'Sim' : 'Não');
        this.addField(doc, 'Trat. Térmico Peça Bruta', ficha.tratamento_termico_peca_bruta || '-');
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
            const etapaOrigem = ETAPAS[mov.etapa_origem] || mov.etapa_origem;
            const etapaDestino = ETAPAS[mov.etapa_destino] || mov.etapa_destino;
            doc.fontSize(9).font('Helvetica')
               .text(`${data} - ${etapaOrigem} → ${etapaDestino} (${mov.usuario?.nome || 'Sistema'})`);
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

  addComparativeField(doc, label, estimado, obtido) {
    const startX = 40;
    doc.fontSize(9).font('Helvetica');
    doc.text(label, startX, doc.y, { width: 180, continued: false });
    doc.text(String(estimado), startX + 200, doc.y - 12, { width: 100 });
    doc.text(String(obtido), startX + 320, doc.y - 12, { width: 100 });
    doc.moveDown(0.3);
  }
}

module.exports = new PDFService();
