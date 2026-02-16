import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";

import { corsOptions } from "./config/cors.js";

import { setupWebSocket } from "./servers/Chat.ws.js";
import { SetupServer } from "./servers/App.server.js";

import auth from "./routes/auth.js";
import chat from "./routes/chat.js";

dotenv.config({ path: ".env" });

const app = express();
const server = createServer(app);

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static("static"));

app.use("/auth", auth);
app.use("/chat", chat);

setupWebSocket(server);

SetupServer(server);
