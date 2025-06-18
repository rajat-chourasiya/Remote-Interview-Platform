// server.ts
import express from "express";
import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // SOCKET EVENTS
  io.on("connection", (socket) => {
    console.log("✅ A user connected:", socket.id);

    socket.on("code-change", (code: string) => {
      socket.broadcast.emit("code-update", code);
    });

      socket.on("question-change", (questionId) => {
        socket.broadcast.emit("question-change", questionId);
  });

  socket.on("language-change", (lang) => {
    socket.broadcast.emit("language-change", lang);
  });

  socket.on("custom-question", (q) => {
    socket.broadcast.emit("custom-question", q);
  });

  socket.on("start-timer", (time) => {
    socket.broadcast.emit("start-timer", time);
  });

    socket.on("disconnect", () => {
      console.log("❌ A user disconnected:", socket.id);
    });
  });

  // FOR NEXT.JS PAGES/API ROUTES
 /*expressApp.use((req, res) => {
  handle(req, res);
});*/

expressApp.use(async (req, res) => {
  try {
    await handle(req, res);
  } catch (err) {
    console.error("Next.js handler error:", err);
    res.status(500).send("Internal Server Error");
  }
});



  // RUN SERVER
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`🚀 Ready on http://localhost:${PORT}`);
  });
});
