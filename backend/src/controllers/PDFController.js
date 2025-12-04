const PDFService = require('../services/PDFService');

class PDFController {
  async gerarPDF(req, res) {
    try {
      const { fichaId } = req.params;

      const pdfBuffer = await PDFService.gerarPDFFicha(fichaId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=ficha-${fichaId}.pdf`);
      res.setHeader('Content-Length', pdfBuffer.length);

      return res.send(pdfBuffer);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      if (error.message === 'Ficha não encontrada') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro ao gerar PDF' });
    }
  }
}

module.exports = new PDFController();
