import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const IV_LENGTH = 16;

class EncryptionService {
  constructor() {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
    this.key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
  }

  /**
   * Шифрует данные
   * @param {any} data - любые данные для шифрования
   * @returns {Object} - { iv: string, data: string }
   */
  encrypt(data) {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv("aes-256-cbc", this.key, iv);

      let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
      encrypted += cipher.final("hex");

      return {
        iv: iv.toString("hex"),
        data: encrypted,
      };
    } catch (err) {
      console.error("Ошибка шифрования:", err);
      throw new Error("Не удалось зашифровать данные");
    }
  }

  /**
   * Дешифрует данные
   * @param {Object} encryptedData - { iv: string, data: string }
   * @returns {any} - расшифрованные данные
   */
  decrypt(encryptedData) {
    try {
      // Проверяем структуру
      if (!encryptedData || !encryptedData.iv || !encryptedData.data) {
        throw new Error("Неверный формат зашифрованных данных");
      }

      const iv = Buffer.from(encryptedData.iv, "hex");
      const encryptedText = Buffer.from(encryptedData.data, "hex");

      const decipher = crypto.createDecipheriv("aes-256-cbc", this.key, iv);

      let decrypted = decipher.update(encryptedText, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return JSON.parse(decrypted);
    } catch (err) {
      console.error("Ошибка дешифрования:", err);
      throw new Error("Не удалось расшифровать данные");
    }
  }

  /**
   * Проверяет, являются ли данные зашифрованными
   * @param {any} data - данные для проверки
   * @returns {boolean}
   */
  isEncrypted(data) {
    return (
      data &&
      typeof data === "object" &&
      "iv" in data &&
      "data" in data &&
      typeof data.iv === "string" &&
      typeof data.data === "string"
    );
  }
}

export default new EncryptionService();
