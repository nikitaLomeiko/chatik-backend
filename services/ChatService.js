import Chat from "../entities/Chat.js";

class ChatService {
  async createChat(chatName, ownerId) {
    try {
      const dataId = Date.now();

      const chat = new Chat({
        dataId: dataId,
        ownerId: ownerId,
        roomname: chatName,
      });

      await chat.save();

      return {
        chatId: chat._id,
        dataId: dataId,
        roomname: chat.roomname,
        ownerId: chat.ownerId,
      };
    } catch (err) {
      console.error("Ошибка в ChatService.createChat:", err);
      throw err;
    }
  }

  async getUserChats(ownerId) {
    try {
      if (!ownerId) {
        console.log("❌ getUserChats: ownerId не указан");
        return [];
      }

      console.log(`🔍 Поиск чатов для пользователя: ${ownerId}`);

      const chats = await Chat.find({ ownerId: ownerId })
        .sort({ createdAt: -1 })
        .select("_id dataId roomname ownerId createdAt");

      return chats.map((chat) => ({
        id: chat._id,
        dataId: chat.dataId,
        name: chat.roomname,
        key: chat.key,
        ownerId: chat.ownerId,
        createdAt: chat.createdAt,
      }));
    } catch (err) {
      console.error("Ошибка в ChatService.getUserChats:", err);
      return [];
    }
  }

  async getChatById(dataId) {
    try {
      return await Chat.findOne({ dataId });
    } catch (err) {
      console.error("Ошибка в ChatService.getChatById:", err);
      throw err;
    }
  }

  async getChatByKey(key) {
    try {
      return await Chat.findOne({ key });
    } catch (err) {
      console.error("Ошибка в ChatService.getChatByDataId:", err);
      throw err;
    }
  }

  async deleteChat(chatId) {
    try {
      return await Chat.findByIdAndDelete(chatId);
    } catch (err) {
      console.error("Ошибка в ChatService.deleteChat:", err);
      throw err;
    }
  }
}

export default new ChatService();
