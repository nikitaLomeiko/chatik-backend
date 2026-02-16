import mongoose from "mongoose";

export async function SetupServer(server) {
  try {
    const port = process.env.PORT;
    const db_url = process.env.DB_URL;

    console.log(db_url);

    await mongoose.connect(db_url);
    server.listen(port, () => {
      console.log(`🚀 Сервер запущен на http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Ошибка подключения к MongoDB:", err);
  }
}
