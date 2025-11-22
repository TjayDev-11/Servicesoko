import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
// Get all posts or filter by category
router.get('/', async (req, res) => {
  const { category } = req.query;
  const where = category && category !== 'all' ? { category } : {};
  try {
    const posts = await prisma.blogPost.findMany({ where });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get single post by slug
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const post = await prisma.blogPost.findUnique({ where: { slug } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});
export default router;