// src/routes/media.js
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const prisma  = require('../services/prisma');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configuração Multer (armazenamento em disco)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${file.originalname}`;
    cb(null, unique);
  }
});
const upload = multer({ storage });


router.post(
  '/upload',
  authenticateToken,
  upload.single('file'),
  async (req, res) => {
    const { visibility } = req.body; // "PUBLIC" ou "PRIVATE"
    const file = req.file;
    const token = req.accessToken;
    if (!file) return res.status(400).json({ error: 'Arquivo não recebido' });

    const asset = await prisma.asset.create({
      data: {
        filename:    file.filename,
        mimetype:    file.mimetype,
        size:        file.size,
        path:        `uploads/${file.filename}`,
        visibility,
        uploadedBy:  { connect: { id: token.id } },
      }
    });

    res.status(201).json(asset);
  }
);


router.get('/public', async (req, res) => {
  const list = await prisma.asset.findMany({
    where: { visibility: 'PUBLIC' },
    orderBy: { uploadedAt: 'desc' }
  });
  res.json(list);
});


router.get('/private', authenticateToken, async (req, res) => {
  const token = req.accessToken;
  const list = await prisma.asset.findMany({
    where: {
      visibility: 'PRIVATE',
      uploadedById: token.id
    },
    orderBy: { uploadedAt: 'desc' }
  });
  res.json(list);
});


router.get('/:id/download', authenticateToken, async (req, res) => {
  const token = req.accessToken;
  const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
  if (!asset) return res.status(404).json({ error: 'Asset não encontrado' });

  if (asset.visibility === 'PRIVATE' && asset.uploadedById !== token.id || token.is_admin) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  res.download(asset.path, asset.filename);
});


router.get('/uploads/:id', authenticateToken, async (req, res) => {
  const token = req.accessToken;
  const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
  if (!asset) return res.status(404).json({ error: 'Mídia não encontrada' });

  if (asset.visibility === 'PRIVATE' && asset.uploadedById !== token.id || token.is_admin) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  res.download(asset.path, asset.filename);
});

router.get('/uploads/public/:id', async (req, res) => {
  const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
  if (!asset) return res.status(404).json({ error: 'Mídia não encontrada' });

  if (asset.visibility === 'PRIVATE') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  res.download(asset.path, asset.filename);
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const token = req.accessToken;
  const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
  if (!asset) return res.status(404).json({ error: 'Mídia não encontrada' });
  if (asset.uploadedById !== token.id)
    return res.status(403).json({ error: 'Acesso negado' });

  fs.unlinkSync(asset.path);

  await prisma.asset.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

module.exports = router;
