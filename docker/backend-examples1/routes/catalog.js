var express = require('express');
var router = express.Router();

const prisma = require('../services/prisma');

const { exceptionHandler, fileHandler } = require('../services/handlers');
const { authenticateToken } = require('../middleware/auth');
const uploadSingle = require('../middleware/uploadSingle');
const uploadPrivate = require('../middleware/uploadPrivate');

/* GET /api/catalog - Lista todas as ofertas com paginação de 10 em 10. */
router.get('/', async function(req, res) {
  const ITEMS_PER_PAGE = 10;
  const page = Number(req.query.page) || 1;
  try {
    const catalog = await prisma.offering.findMany({
      take: ITEMS_PER_PAGE,
      skip: (page - 1) * ITEMS_PER_PAGE,
      include: {
        assets: true,
      },
    });
    const totalItems = await prisma.offering.count();
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    res.json({
      catalog,
      page,
      totalPages,
      totalItems,
    });
  }
  catch (exception) {
    exceptionHandler(exception, res);
  }
});

/* POST /api/catalog - Cria uma oferta */
router.post('/', authenticateToken, uploadSingle, async (req, res) => { // arrow function
  if (!req.accessToken.is_admin) {
    return res.status(403).end();
  }
  const data = req.body; 
  console.log(data);

  const upload = req.upload || null;
  if (upload) {
    console.log(upload);
    data.image = upload.customPath;
  }
  try {
    if ('price' in data) {
      data.price = Number(data.price);
    }
    offeringData = data;
    if ('assetIds' in data) {
      if (Array.isArray(data.assetIds) && data.assetIds.length > 0) {
        offeringData.assets = {
          connect: data.assetIds.map(id => ({ id })),
        }
      }
      delete offeringData.assetIds;
    }
    const catalogItem = await prisma.offering.create({
      data: offeringData,
      include: {
        assets: true,
      },
    });
    res.status(201).json(catalogItem);
  }
  catch (exception) {
    exceptionHandler(exception, res);
  }
});

/* GET /api/catalog/{id} - Obtém uma oferta por id */
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const catalogItem = await prisma.offering.findUniqueOrThrow({
      where: {
        id: id
      }
    });
    catalogItem.image = await fileHandler(req, catalogItem);
    res.json(catalogItem);
  }
  catch (exception) {
    exceptionHandler(exception, res);
  }
});


/* PATCH /api/catalog/{id} - Atualiza uma oferta pelo id */
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.accessToken.is_admin) {
      return res.status(403).end();
    }
    const id = Number(req.params.id);
    const data = req.body;
    const catalogItem = await prisma.offering.update({
      where: {
        id: id
      },
      data: data,
    });
    res.json(catalogItem);
  }
  catch (exception) {
    exceptionHandler(exception, res);
  }
});

/* DELETE /api/catalog/{id} - Exclui uma oferta por ID */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.accessToken.is_admin) {
      return res.status(403).end();
    }
    const id = Number(req.params.id);
    const catalogItem = await prisma.offering.update({ // exclusão lógica
      where: {
        id: id
      },
      data: {
        enabled: false,
      },
    });
    res.status(204).end();  // 204 No content
    
  }
  catch (exception) {
    exceptionHandler(exception, res);
  }
});

// Resposta para rotas não existentes.
router.all('*', (req, res) => {
  res.status(501).end(); // 501 Not Implemented
});

module.exports = router;
