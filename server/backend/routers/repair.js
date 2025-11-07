// ============================================
// 6. repair.routes.js - จัดการแจ้งซ่อม
// ============================================

import { Router } from 'express';
const router = Router();

router.get('/repairs', async (c) => {
  return c.json({ message: 'Get all repairs' })
})
router.get('/repairs/:id', async (c) => {
  return c.json({ message: 'Get repair by ID' })
})
router.post('/repairs', async (c) => {
  return c.json({ message: 'Create repair request' })
})
router.patch('/repairs/:id/status', async (c) => {
  return c.json({ message: 'Update repair status' })
})
router.delete('/repairs/:id', async (c) => {
  return c.json({ message: 'Delete repair' })
})

export default router