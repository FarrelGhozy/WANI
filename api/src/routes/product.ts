import { Router } from "express"
import * as productController from "@/src/controllers/product"
import { requireAuth } from "@/src/middleware/auth"
import { requireJwt } from "@/src/middleware/jwt"
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
router.post("/", requireJwt, validate({ body: createProductSchema }), productController.createProduct)
router.put("/:id", requireJwt, validate({ body: updateProductSchema }), productController.updateProduct)
router.delete("/:id", requireJwt, productController.deleteProduct)

export default router

export const categoryRouter = Router()

categoryRouter.get("/", productController.listCategories)
categoryRouter.post("/", requireJwt, validate({ body: createCategorySchema }), productController.createCategory)
categoryRouter.put("/:id", requireJwt, validate({ body: updateCategorySchema }), productController.updateCategory)
categoryRouter.delete("/:id", requireJwt, productController.deleteCategory)
