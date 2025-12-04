const { Router } = require('express');
const NotificacaoController = require('../controllers/NotificacaoController');
const auth = require('../middlewares/auth');

const router = Router();

router.use(auth);

router.get('/', NotificacaoController.index);
router.get('/nao-lidas', NotificacaoController.naoLidas);
router.put('/:id/lida', NotificacaoController.marcarLida);
router.put('/marcar-todas-lidas', NotificacaoController.marcarTodasLidas);
router.delete('/:id', NotificacaoController.destroy);

module.exports = router;
