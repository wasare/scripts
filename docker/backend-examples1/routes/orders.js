var express = require('express');
var router = express.Router();

const prisma = require('../services/prisma');

const { authenticateToken } = require('../middleware/auth');
const { exceptionHandler, fileHandler } = require('../services/handlers');

const orderStatus = ['Aguardando', 'Em Preparação', 'A Caminho', 'Entregue', 'Cancelado'];

/* GET /api/orders - Lista todos os pedidos com paginação de 10 em 10. */
router.get('/', authenticateToken, async (req, res) =>{
  const ITEMS_PER_PAGE = 10;
  const page = Number(req.query.page) || 1;
  try {
    const orders = await prisma.order.findMany({
      take: ITEMS_PER_PAGE,
      skip: (page - 1) * ITEMS_PER_PAGE,
      include: {
        user: true,
        orderOffering: {
          include: {
            offering: {
              select: {
                name: true,
                description: true,
                price: true,
                image: true
              },
            },
          }
        },
      },
    });
    const totalItems = await prisma.order.count();
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    res.json({
      orders,
      page,
      totalPages,
      totalItems,
    });
  }
  catch (exception) {
    exceptionHandler(exception, res);
  }
});

/* POST /api/orders - Cria um pedido */
router.post('/', async (req, res) => { // arrow function
  const data = req.body;
  console.log(data);
  try {
    const totalPrice = data.items.reduce((total, item) => total + item.price * item.quantity, 0);
    const orderOffering = data.items.map(item => ({
      offeringId: item.id,
      quantity: item.quantity,
      subtotal: item.price * item.quantity
    }));
    let userId = null;
    if ('customerId' in data) {
      userId = data.customerId;
    }
    const order = await prisma.order.create({
      data: {
        totalPrice,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        userId,
        orderOffering: {
          create: orderOffering
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true
          }
        },
        orderOffering: {
          include: {
            offering: {
              select: {
                name: true,
                description: true,
                price: true,
                image: true
              },
            },
          }
        },
      },
    });
    res.status(201).json(order);
  }
  catch (exception) {
    exceptionHandler(exception, res);
  }
});

/* GET /api/orders/{id} - Obtém um pedido por id */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const order = await prisma.order.findUniqueOrThrow({
      where: {
        id: id
      },
      include: {
        user: true,
        orderOffering: {
          include: {
            offering: {
              select: {
                name: true,
                description: true,
                price: true,
                image: true
              },
            },
          }
        },
      },
    });
    res.json(order);
  }
  catch (exception) {
    exceptionHandler(exception, res);
  }
});

/* GET /api/orders/{id}/{customerPhone} - Obtém um pedido por id e pelo telefone do cliente */
router.get('/:id/:customerPhone', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const order = await prisma.order.findUniqueOrThrow({
      where: {
        id: id,
        customerPhone: req.params.customerPhone
      },
      include: {
        user: true,
        orderOffering: {
          include: {
            offering: {
              select: {
                name: true,
                description: true,
                price: true,
                image: true
              },
            },
          }
        },
      },
    });
    res.json(order);
  }
  catch (exception) {
    exceptionHandler(exception, res);
  }
});

/* PATCH /api/orders/{id} - Atualiza um pedido pelo id */
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.accessToken.is_admin) {
      return res.status(403).end();
    }
    const id = Number(req.params.id);
    const status = req.body.status;
    if (orderStatus.includes(status)) {
      const order = await prisma.order.update({
        where: {
          id: id
        },
        data: { status },
        include: {
          user: true,
          orderOffering: {
            include: {
              offering: {
                select: {
                  name: true,
                  description: true,
                  price: true,
                  image: true
                },
              },
            }
          },
        },
      });
      res.json(order);
    } else {
      res.status(400).end({ message: 'Status inválido.' });
    }
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
