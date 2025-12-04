const { Router } = require('express');
const ImagemController = require('../controllers/ImagemController');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = Router();

router.use(auth);

router.get('/ficha/:fichaId', ImagemController.index);
router.post('/ficha/:fichaId', upload.single('imagem'), ImagemController.store);
router.get('/:id/download', ImagemController.download);
router.delete('/:id', ImagemController.destroy);

module.exports = router;
