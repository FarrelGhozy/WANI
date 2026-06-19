import { Router, Response, NextFunction } from "express";
import { requireMerchant, AuthRequest } from "../middleware/auth.js";
import {
  getSessionStatus, initiateConnection, getQRCode, disconnectSession, getSessionHistory,
} from "../services/wa-session.service.js";

const router = Router();

function merchantId(req: AuthRequest): string {
  const id = req.params.merchantId as string;
  return id === 'me' ? req.merchant!.id : id;
}

router.get('/wa-session/me/status', requireMerchant, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await getSessionStatus(req.merchant!.id)); } catch (err) { next(err); }
});
router.post('/wa-session/me/connect', requireMerchant, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await initiateConnection(req.merchant!.id)); } catch (err) { next(err); }
});
router.get('/wa-session/me/qr', requireMerchant, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await getQRCode(req.merchant!.id)); } catch (err) { next(err); }
});
router.post('/wa-session/me/disconnect', requireMerchant, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await disconnectSession(req.merchant!.id)); } catch (err) { next(err); }
});
router.get('/wa-session/me/history', requireMerchant, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await getSessionHistory(req.merchant!.id)); } catch (err) { next(err); }
});

router.get('/wa-session/:merchantId/status', requireMerchant, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await getSessionStatus(merchantId(req))); } catch (err) { next(err); }
});
router.post('/wa-session/:merchantId/connect', requireMerchant, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await initiateConnection(merchantId(req))); } catch (err) { next(err); }
});
router.get('/wa-session/:merchantId/qr', requireMerchant, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await getQRCode(merchantId(req))); } catch (err) { next(err); }
});
router.post('/wa-session/:merchantId/disconnect', requireMerchant, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await disconnectSession(merchantId(req))); } catch (err) { next(err); }
});
router.get('/wa-session/:merchantId/history', requireMerchant, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await getSessionHistory(merchantId(req))); } catch (err) { next(err); }
});

export { router as waSessionRouter };
