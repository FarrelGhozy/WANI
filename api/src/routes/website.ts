import { Router } from "express";
import * as websiteController from "@/controllers/website";
import { requireJwt } from "@/middleware/jwt";
import { validate } from "@/middleware/validate";
import { updateWebsiteSchema, generateWebsiteSchema } from "@/schemas/website";

const router = Router();

router.get("/", websiteController.getWebsiteConfig);
router.put(
  "/",
  requireJwt,
  validate({ body: updateWebsiteSchema }),
  websiteController.updateWebsiteConfig
);
router.post(
  "/generate",
  requireJwt,
  validate({ body: generateWebsiteSchema }),
  websiteController.generateWebsite
);
router.get("/download", requireJwt, websiteController.downloadWebsite);
router.post("/publish", requireJwt, websiteController.publishWebsite);
router.get("/generations", requireJwt, websiteController.listGenerations);
router.delete(
  "/generations/:id",
  requireJwt,
  websiteController.deleteGeneration
);

export default router;
