var express = require('express');
var router = express.Router();

const prisma = require('../services/prisma');
const bcrypt = require('bcryptjs');

const { exceptionHandler, fileHandler } = require('../services/handlers');
const { generateAccessToken, authenticateToken } = require('../middleware/auth');
const uploadSingle = require('../middleware/uploadSingle');
const uploadPrivate = require('../middleware/uploadPrivate');

/* GET /api/users - Lista todos os usuários. */
router.get('/', async function(req, res) {
  const USERS_PER_PAGE = 5;
  const page = Number(req.query.page) || 1;
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
      take: USERS_PER_PAGE,
      skip: (page - 1) * USERS_PER_PAGE,
    });
    const totalUsers = await prisma.user.count();
    const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE);
    res.json({
      users,
      page,
      totalPages,
      totalUsers,
    });
  }
  catch (exception) {
    exceptionHandler(exception, res);
  }
});

/* POST /api/users - Cria um usuário */
router.post('/', uploadPrivate, async (req, res) => { // arrow function
  const data = req.body; // email, name?, password?
  console.log(data);
  if ('perfil_acess' in data) { // não permite criar usuário admin
    delete data.is_admin;
  }
  if (!data.password || data.password.length < 8) {
    return res.status(400).json({
      error: "A senha é obrigatória e deve ter no mínimo 8 caracteres"
    });
  }
  data.password = await bcrypt.hash(data.password, 10);
  const upload = req.upload || null;
  if (upload) {
    console.log(upload);
    data.image = upload.customPath;
  }
  try {
    const user = await prisma.user.create({
      data: data,
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    });

    user.image = fileHandler(req, user);

    const jwt = generateAccessToken(user);
    user.accessToken = jwt;
    res.status(201).json(user);
  }
  catch (exception) {
    exceptionHandler(exception, res);
  }
});

/* GET /api/users/{id} - Obtém um usuário por id */
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUniqueOrThrow({
      where: {
        id: id
      },
      // include: {
      //   filmes: true
      // },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        filmes: {
          select: {
            filme: true
          }
        }
      }
    });
    user.image = await fileHandler(req, user);
    res.json(user);
  }
  catch (exception) {
    exceptionHandler(exception, res);
  }
});


/* PATCH /api/users/{id} - Atualiza um usuário pelo id */
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;
    const token = req.accessToken;
    const checkUser = await prisma.user.findUnique({
      where: {
        id: id,
        email: token.email
      }
    });
    if (checkUser === null || id !== token.id) {
      return res.sendStatus(403);
    }
    if ('password' in data) { // 
      if (data.password.length < 8) {
        return res.status(400).json({
          error: "A senha deve ter no mínimo 8 caracteres"
        });
      }
      data.password = await bcrypt.hash(data.password, 10);
    }
    const user = await prisma.user.update({
      where: {
        id: id
      },
      data: data,
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    res.json(user);
  }
  catch (exception) {
    exceptionHandler(exception, res);
  }
});

/* DELETE /api/users/{id} - Exclui um usuário por ID */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.accessToken.is_admin) {
      return res.status(403).end();
    }
    const id = Number(req.params.id);
    const user = await prisma.user.delete({
      where: {
        id: id
      }
    });
    res.status(204).end();  // 204 No content
    
  }
  catch (exception) {
    exceptionHandler(exception, res);
  }
});


/* POST /api/users/login - valida o acesso de um usuário */
router.post('/login', async (req, res) => {
  try {
    const data = req.body;
    if (!('password' in data) || !('email' in data)) {
      return res.status(401).json({
        error: "Usuário e senha são obrigatórios"
      });
    }
    const user = await prisma.user.findFirstOrThrow({
      where: {
        email: data.email
      }
    });
    const passwordCheck = await bcrypt.compare(data.password, user.password);
    console.log(passwordCheck);
    if (!passwordCheck) {
      return res.status(401).json({
        error: "Usuário e/ou senha incorreto(s)"
      });
    }
    delete user.password;
    const jwt = generateAccessToken(user);
    user.accessToken = jwt;
    res.json(user);
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
