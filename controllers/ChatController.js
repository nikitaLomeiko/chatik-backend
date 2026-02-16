import { v4 as uuidv4 } from "uuid";
import { WebSocket } from "ws";
import ChatService from "../services/ChatService.js";
import { FileService } from "../services/FileService.js";
import encryptionService from "../services/EncryptionService.js";

const chatRooms = new Map();
const userConnections = new Map();

class ChatController {
  async createChat(req, res) {
    try {
      const { chatName } = req.body;
      const creatorName = req.user?.username || "null";
      const ownerId = req.user?.id || 1;

      if (!chatName || !creatorName) {
        return res.status(400).json({
          success: false,
          message: "Название чата и имя создателя обязательны",
        });
      }

      const chat = await ChatService.createChat(chatName, ownerId);

      const fileName = `chat_${chat.dataId}.json`;
      const fileService = new FileService(fileName);

      const chatData = {
        id: chat.dataId,
        name: chatName,
        createdBy: creatorName,
        ownerId: ownerId,
        createdAt: new Date().toISOString(),
        participants: [creatorName],
        messages: [],
      };

      const encryptedData = encryptionService.encrypt(chatData);
      await fileService.asyncWrite(JSON.stringify(encryptedData, null, 2));

      chatRooms.set(chat.dataId, {
        clients: new Set(),
        messages: [],
      });

      res.status(201).json({
        success: true,
        data: {
          chatId: chat.chatId,
          dataId: chat.dataId,
          chatName: chat.roomname,
          key: chat.key,
          inviteLink: `/chat/join/${chat.dataId}`,
        },
        message: "Чат успешно создан",
      });
    } catch (err) {
      console.error("Ошибка создания чата:", err);
      res.status(500).json({
        success: false,
        message: "Ошибка при создании чата",
      });
    }
  }

  async joinChat(req, res) {
    try {
      const { chatId } = req.params;
      const userName = req.user.name;

      if (!userName) {
        return res.json({
          success: false,
          message: "Пользователь не определен",
        });
      }

      const chat = await ChatService.getChatById(chatId);

      if (!chat) {
        return res.json({
          success: false,
          message: "Чат не найден",
        });
      }

      const fileService = new FileService(`chat_${chat.dataId}.json`);
      const fileData = await fileService.asyncRead();

      if (!fileData) {
        return res.status(404).json({
          success: false,
          message: "Данные чата не найдены",
        });
      }
      let chatData;
      try {
        const parsed = JSON.parse(fileData);

        if (encryptionService.isEncrypted(parsed)) {
          chatData = encryptionService.decrypt(parsed);
        } else {
          console.warn(
            "⚠️ Найден незашифрованный чат, рекомендуется пересоздать",
          );
          chatData = parsed;
        }
      } catch (parseErr) {
        console.error("Ошибка парсинга данных чата:", parseErr);
        return res.status(500).json({
          success: false,
          message: "Ошибка при чтении данных чата",
        });
      }

      if (!chatData.participants.includes(userName)) {
        chatData.participants.push(userName);

        const encryptedData = encryptionService.encrypt(chatData);
        await fileService.asyncWrite(JSON.stringify(encryptedData, null, 2));
      }

      if (!chatRooms.has(chat.dataId)) {
        chatRooms.set(chat.dataId, {
          clients: new Set(),
          messages: chatData.messages || [],
        });
      }

      res.json({
        success: true,
        data: {
          chatId: chat._id,
          dataId: chat.dataId,
          chatName: chat.roomname,
          participants: chatData.participants,
          messages: chatData.messages,
        },
        message: "Подключение к чату выполнено",
      });
    } catch (err) {
      console.error("Ошибка подключения к чату:", err);
      res.status(500).json({
        success: false,
        message: "Ошибка при подключении к чату",
      });
    }
  }

  async getChatsByUserId(req, res) {
    const userId = req.user?.id;

    if (!userId) {
      res.json({
        success: false,
        message: "Пользователь не авторизован",
      });
    }

    const chats = await ChatService.getUserChats(userId);

    console.log(chats);

    res.json({
      success: true,
      data: chats,
    });
  }

  async handleWebSocket(ws, req) {
    const dataId = req.params.chatId;
    const userName = req.user?.name;
    const userId = req.user?.id;

    if (!userName || !dataId) {
      ws.close(1008, "Имя пользователя или чата не определен");
      return;
    }

    console.log(`🔌 WebSocket подключение: ${userName} -> чат ${dataId}`);

    let room = chatRooms.get(dataId);

    if (!room) {
      try {
        const fileName = `chat_${dataId}.json`;
        const fileService = new FileService(fileName);
        const fileData = await fileService.asyncRead();

        let messages = [];

        if (fileData) {
          try {
            const parsed = JSON.parse(fileData);

            if (encryptionService.isEncrypted(parsed)) {
              const chatData = encryptionService.decrypt(parsed);
              messages = chatData.messages || [];
            } else {
              messages = parsed.messages || [];
            }
          } catch (parseErr) {
            console.error("Ошибка чтения истории чата:", parseErr);
          }
        }

        room = {
          clients: new Set(),
          messages: messages,
        };
        chatRooms.set(dataId, room);
      } catch (err) {
        console.error("Ошибка загрузки чата:", err);
        room = { clients: new Set(), messages: [] };
        chatRooms.set(dataId, room);
      }
    }

    room.clients.add(ws);
    userConnections.set(userName, { ws, dataId, userName, userId });

    ws.send(
      JSON.stringify({
        type: "history",
        data: room.messages.slice(-50),
      }),
    );

    this.broadcastToRoom(dataId, {
      type: "system",
      data: {
        type: "system",
        content: `${userName} присоединился к чату`,
        timestamp: new Date().toISOString(),
        userName: "system",
      },
    });

    ws.on("message", async (message) => {
      try {
        const parsedMessage = JSON.parse(message.toString());

        const chatMessage = {
          id: uuidv4(),
          type: "message",
          userName: userName,
          userId: userId,
          content: parsedMessage.content,
          timestamp: new Date().toISOString(),
        };

        room.messages.push(chatMessage);

        try {
          const fileName = `chat_${dataId}.json`;
          const fileService = new FileService(fileName);
          const fileData = await fileService.asyncRead();

          let chatData;

          if (fileData) {
            const parsed = JSON.parse(fileData);

            if (encryptionService.isEncrypted(parsed)) {
              chatData = encryptionService.decrypt(parsed);
            } else {
              chatData = parsed;
            }
          } else {
            chatData = {
              id: dataId,
              name: "Чат",
              createdBy: "system",
              ownerId: 1,
              createdAt: new Date().toISOString(),
              participants: [userName],
              messages: [],
            };
          }

          chatData.messages = chatData.messages || [];
          chatData.messages.push(chatMessage);

          if (chatData.messages.length > 1000) {
            chatData.messages = chatData.messages.slice(-1000);
          }

          const encryptedData = encryptionService.encrypt(chatData);
          await fileService.asyncWrite(JSON.stringify(encryptedData, null, 2));
        } catch (fileErr) {
          console.error("Ошибка сохранения в файл:", fileErr);
        }

        this.broadcastToRoom(dataId, {
          type: "message",
          data: chatMessage,
        });

        console.log(`💬 ${userName}: ${parsedMessage.content}`);
      } catch (err) {
        console.error("Ошибка обработки сообщения:", err);
        ws.send(
          JSON.stringify({
            type: "error",
            data: { message: "Ошибка отправки сообщения" },
          }),
        );
      }
    });

    ws.on("close", () => {
      console.log(`🔌 Отключение ${userName} от чата ${dataId}`);

      if (room) {
        room.clients.delete(ws);

        this.broadcastToRoom(dataId, {
          type: "system",
          data: {
            type: "system",
            content: `${userName} покинул чат`,
            timestamp: new Date().toISOString(),
            userName: "system",
          },
        });

        if (room.clients.size === 0) {
          chatRooms.delete(dataId);
        }
      }

      userConnections.delete(userName);
    });

    ws.on("error", (error) => {
      console.error(`Ошибка WebSocket для ${userName}:`, error);
    });
  }

  broadcastToRoom(dataId, message) {
    const room = chatRooms.get(dataId);
    if (!room) return;

    const messageStr = JSON.stringify(message);

    room.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
}

export default new ChatController();
