import { WebSocketServer } from "ws";
import { verifyToken } from "../config/jwt.js";
import ChatService from "../services/ChatService.js";
import ChatController from "../controllers/ChatController.js";

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (ws, req) => {
    try {
      const { token, chatId, userName } = parseConnectionParams(req);

      if (!token || !chatId || !userName) {
        return ws.close(1008, "Токен, chatId и userName обязательны");
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return ws.close(1008, "Недействительный токен");
      }

      const chat = await ChatService.getChatById(parseInt(chatId));
      if (!chat) {
        return ws.close(1008, "Чат не найден");
      }

      const mockReq = createMockRequest(chat, userName, decoded);
      await ChatController.handleWebSocket(ws, mockReq);
    } catch (err) {
      console.error("WebSocket error:", err);
      ws.close(1011, "Внутренняя ошибка сервера");
    }
  });

  return wss;
}

function parseConnectionParams(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  return {
    token: url.searchParams.get("token"),
    chatId: url.searchParams.get("chatId"),
    userName: url.searchParams.get("userName"),
  };
}

function createMockRequest(chat, userName, decoded) {
  return {
    params: { chatId: chat.dataId.toString() },
    query: { userName },
    user: { id: decoded.id, name: decoded.name },
  };
}
