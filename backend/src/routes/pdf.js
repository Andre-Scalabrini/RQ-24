const { Router } = require('express');
const PDFController = require('../controllers/PDFController');
const auth = require('../middlewares/auth');

const router = Router();

router.use(auth);

router.get('/ficha/:fichaId', PDFController.gerarPDF);

module.exports = router;
