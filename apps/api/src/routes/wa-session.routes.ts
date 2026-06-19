import { Router, Response, NextFunction } from "express";
import { requireMerchant, AuthRequest } from "../middleware/auth.js";
import {
  getSessionStatus, initiateConnection, getQRCode, disconnectSession, getSessionHistory,
} from "../services/wa-session.service.js";

const router = Router();

function me(req: AuthRequest) { return req.merchant!.id; }

router.get("/wa-session/me/status", requireMerchant, (req: AuthRequest, res: Response, next: NextFunction) => {
  getSessionStatus(me(req)).then(r => res.json(r)).catch(next);
});
router.post("/wa-session/me/connect", requireMerchant, (req: AuthRequest, res: Response, next: NextFunction) => {
  initiateConnection(me(req)).then(r => res.json(r)).catch(next);
});
router.get("/wa-session/me/qr", requireMerchant, (req: AuthRequest, res: Response, next: NextFunction) => {
  getQRCode(me(req)).then(r => res.json(r)).catch(next);
});
router.post("/wa-session/me/disconnect", requireMerchant, (req: AuthRequest, res: Response, next: NextFunction) => {
  disconnectSession(me(req)).then(r => res.json(r)).catch(next);
});
router.get("/wa-session/me/history", requireMerchant, (req: AuthRequest, res: Response, next: NextFunction) => {
  getSessionHistory(me(req)).then(r => res.json(r)).catch(next);
});

router.get("/wa-session/:merchantId/status", requireMerchant, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await getSessionStatus(req.params.merchantId)); } catch (err) { next(err); }
});
router.post("/wa-session/:merchantId/connect", requireMerchant, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await initiateConnection(req.params.merchantId)); } catch (err) { next(err); }
});
router.get("/wa-session/:merchantId/qr", requireMerchant, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await getQRCode(req.params.merchantId)); } catch (err) { next(err); }
});
router.post("/wa-session/:merchantId/disconnect", requireMerchant, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await disconnectSession(req.params.merchantId)); } catch (err) { next(err); }
});
router.get("/wa-session/:merchantId/history", requireMerchant, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await getSessionHistory(req.params.merchantId)); } catch (err) { next(err); }
});

export { router as waSessionRouter };
