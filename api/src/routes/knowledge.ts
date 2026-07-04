import { Router } from "express"
import * as knowledgeController from "@/src/controllers/knowledge"
import { requireJwt } from "@/src/middleware/jwt"
import { validate } from "@/src/middleware/validate"
import {
  createKnowledgeSchema,
  updateKnowledgeSchema,
  knowledgeQuerySchema,
} from "@/src/schemas/knowledge"

const router = Router()

// Public: list + get (like products)
router.get("/", knowledgeController.listDocuments)
router.get("/:id", knowledgeController.getDocument)

// JWT-protected CRUD
router.post("/", requireJwt, validate({ body: createKnowledgeSchema }), knowledgeController.createDocument)
router.put("/:id", requireJwt, validate({ body: updateKnowledgeSchema }), knowledgeController.updateDocument)
router.delete("/:id", requireJwt, knowledgeController.deleteDocument)

// JWT-protected indexing ops
router.post("/:id/reindex", requireJwt, knowledgeController.reindexDocument)
router.post("/reindex-all", requireJwt, knowledgeController.reindexAllDocuments)

// JWT-protected test query
router.post("/search", requireJwt, validate({ body: knowledgeQuerySchema }), knowledgeController.testQuery)

export default router