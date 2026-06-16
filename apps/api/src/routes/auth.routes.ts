import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { AuthRequest, generateMerchantToken } from '../middleware/auth.js';
import {
  createMerchant,
  getMerchantByPhone,
} from '../services/merchant.service.js';
import { success } from '../utils/helpers.js';

const router = Router();

const registerSchema = z.object({
  businessName: z.string().min(1, 'Nama usaha wajib diisi').max(100),
  phone: z.string().min(10, 'Nomor WA minimal 10 digit').max(20),
});

const loginSchema = z.object({
  phone: z.string().min(1, 'Nomor WA wajib diisi'),
});

// POST /api/auth/register
router.post(
  '/register',
  validate(registerSchema, 'body'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const existing = await getMerchantByPhone(req.body.phone);
      if (existing.success && existing.data) {
        return res.status(409).json({ success: false, error: 'Nomor WA sudah terdaftar' });
      }

      const result = await createMerchant(req.body);
      if (!result.success) {
        return res.status(400).json(result);
      }

      const merchant = result.data as { id: string; businessName: string; phone: string };
      const token = generateMerchantToken({
        id: merchant.id,
        businessName: merchant.businessName,
        phone: merchant.phone,
      });

      res.status(201).json(success({ merchant, token }));
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/auth/login
router.post(
  '/login',
  validate(loginSchema, 'body'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await getMerchantByPhone(req.body.phone);
      if (!result.success || !result.data) {
        return res.status(401).json({ success: false, error: 'Akun tidak ditemukan' });
      }

      const merchant = result.data as { id: string; businessName: string; phone: string };
      const token = generateMerchantToken({
        id: merchant.id,
        businessName: merchant.businessName,
        phone: merchant.phone,
      });

      res.json(success({ merchant, token }));
    } catch (err) {
      next(err);
    }
  },
);

export { router as authRouter };
