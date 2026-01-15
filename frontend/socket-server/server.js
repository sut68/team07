const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({ origin: allowedOrigin, methods: ["GET", "POST"] }));
app.use(express.json());

/* ======================
   Health check
====================== */
app.get("/", (req, res) => {
  res.send("✅ Socket Server is Running!");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"],
  },
});

/* ======================
   Socket logic
====================== */
io.on("connection", (socket) => {
  console.log("✅ connected:", socket.id);

  socket.on("join_room", (room) => {
    if (!room || room === "undefined") return;
    socket.join(String(room));
    console.log(`➡️ ${socket.id} joined room ${room}`);
  });

  socket.on("leave_room", (room) => {
    if (!room || room === "undefined") return;
    socket.leave(String(room));
    console.log(`⬅️ ${socket.id} left room ${room}`);
  });

  /**
   * ❌ BLOCK direct socket broadcast
   * Only backend HTTP can broadcast
   */
  socket.on("send_message", () => {
    console.log("⚠️ send_message ignored (use /broadcast/chat)");
  });

  socket.on("disconnect", () => {
    console.log("❌ disconnected:", socket.id);
  });
});

/* ======================
   HTTP → SOCKET (ONLY broadcast source)
====================== */
app.post("/broadcast/chat", (req, res) => {
  const room = String(req.body.room_id || "");

  if (!room || room === "undefined") {
    return res.status(400).json({ error: "missing room_id" });
  }

  console.log("📢 broadcast/chat ->", room);
  io.to(room).emit("receive_message", req.body);

  res.json({ ok: true });
});

app.post("/broadcast/delete", (req, res) => {
  const room = String(req.body.room_id || "");
  const id = Number(req.body.id);

  if (!room || !id) {
    return res.status(400).json({ error: "missing data" });
  }

  console.log("📢 broadcast/delete ->", room);
  io.to(room).emit("delete_message", { id });

  res.json({ ok: true });
});

/* ======================
   Start server
====================== */
server.listen(3001, "0.0.0.0", () => {
  console.log("✅ Socket server running on :3001");
});
