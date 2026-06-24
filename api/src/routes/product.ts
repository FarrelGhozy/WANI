import { Router } from "express"
import * as productController from "@/src/controllers/product"
import { requireAuth } from "@/src/middleware/auth"
import { validate } from "@/src/middleware/validate"
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  createCategorySchema,
  updateCategorySchema,
} from "@/src/schemas/product"

const router = Router()

router.get("/", validate({ query: productQuerySchema }), productController.listProducts)
router.get("/:id", productController.getProduct)
router.post("/", requireAuth, validate({ body: createProductSchema }), productController.createProduct)
router.put("/:id", requireAuth, validate({ body: updateProductSchema }), productController.updateProduct)
router.delete("/:id", requireAuth, productController.deleteProduct)

export default router

export const categoryRouter = Router()

categoryRouter.get("/", productController.listCategories)
categoryRouter.post("/", requireAuth, validate({ body: createCategorySchema }), productController.createCategory)
categoryRouter.put("/:id", requireAuth, validate({ body: updateCategorySchema }), productController.updateCategory)
categoryRouter.delete("/:id", requireAuth, productController.deleteCategory)
