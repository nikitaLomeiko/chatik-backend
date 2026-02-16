import { writeFile, unlink, readFile } from "node:fs/promises";

const BASE_PATH = "./data";

export class FileService {
  constructor(name) {
    this.name = `./${BASE_PATH}/${name}`;
  }

  async asyncRead() {
    try {
      const data = await readFile(this.name, "utf8");

      console.log("Содержимое файла:", data);
      return data;
    } catch (err) {
      console.error("Ошибка чтения:", err.message);
    }
  }

  async asyncWrite(data) {
    try {
      await writeFile(this.name, data, "utf8");
      console.log("Файл успешно записан");
      return true;
    } catch (err) {
      console.error("Ошибка записи:", err.message);
      return false;
    }
  }

  async asyncDelete() {
    try {
      await unlink(this.name);
      console.log("Файл удален");
      return true;
    } catch (err) {
      if (err.code === "ENOENT") {
        console.log("Файл не существует");
      } else {
        console.error("Ошибка удаления:", err.message);
      }

      return false;
    }
  }
}
