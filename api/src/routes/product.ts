import { Router } from "express";
import * as productController from "@/controllers/product";
import { requireJwt } from "@/middleware/jwt";
import { validate } from "@/middleware/validate";
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  createCategorySchema,
  updateCategorySchema,
} from "@/schemas/product";

const router = Router();

router.get(
  "/",
  validate({ query: productQuerySchema }),
  productController.listProducts
);
router.get("/:id", productController.getProduct);
router.post(
  "/",
  requireJwt,
  validate({ body: createProductSchema }),
  productController.createProduct
);
router.put(
  "/:id",
  requireJwt,
  validate({ body: updateProductSchema }),
  productController.updateProduct
);
router.delete("/:id", requireJwt, productController.deleteProduct);

export default router;

export const categoryRouter = Router();

categoryRouter.get("/", productController.listCategories);
categoryRouter.post(
  "/",
  requireJwt,
  validate({ body: createCategorySchema }),
  productController.createCategory
);
categoryRouter.put(
  "/:id",
  requireJwt,
  validate({ body: updateCategorySchema }),
  productController.updateCategory
);
categoryRouter.delete("/:id", requireJwt, productController.deleteCategory);
