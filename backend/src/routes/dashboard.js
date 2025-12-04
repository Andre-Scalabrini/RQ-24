const { Router } = require('express');
const DashboardController = require('../controllers/DashboardController');
const auth = require('../middlewares/auth');

const router = Router();

router.use(auth);

// Dashboard endpoints
router.get('/resumo', DashboardController.resumo);
router.get('/graficos/etapas', DashboardController.graficoEtapas);
router.get('/graficos/mensal', DashboardController.graficoMensal);
router.get('/fichas-atrasadas', DashboardController.fichasAtrasadas);
router.get('/fichas-recentes', DashboardController.fichasRecentes);
router.get('/fichas-proximas-prazo', DashboardController.fichasProximasPrazo);

module.exports = router;
