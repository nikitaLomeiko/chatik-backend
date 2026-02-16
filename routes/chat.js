import express from "express";
import ChatController from "../controllers/ChatController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/create", ChatController.createChat);
router.get("/join/:chatId", ChatController.joinChat);
router.get("/my", ChatController.getChatsByUserId);

export default router;
