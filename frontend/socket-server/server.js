const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// ✅ ADD THIS: A simple home page route
app.get("/", (req, res) => {
  res.send("✅ Socket Server is Running!");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("✅ connected:", socket.id);

  socket.on("join_room", (room) => {
    socket.join(String(room));
    console.log(`Socket ${socket.id} JOINED room: ${room}`);
  });

  socket.on("leave_room", (room) => {
    socket.leave(String(room));
    console.log(`Socket ${socket.id} LEFT room: ${room}`);
  });

  socket.on("send_message", (data) => {
    const room = String(data?.room_id);
    if (room) {
      console.log("⚡ socket send_message ->", room);
      io.to(room).emit("receive_message", data);
    }
  });

  socket.on("delete_message", (data) => {
    const room = String(data?.room_id);
    if (room) {
      console.log("⚡ socket delete_message ->", room);
      io.to(room).emit("delete_message", data);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ disconnected:", socket.id);
  });
});

app.post("/broadcast/chat", (req, res) => {
  const room = String(req.body.room_id);
  if (!room || room === "undefined") {
    console.log("⚠️ broadcast/chat missing room_id");
    return res.status(400).json({ error: "missing room_id" });
  }
  console.log("📢 HTTP broadcast/chat ->", room);
  io.to(room).emit("receive_message", req.body);
  res.json({ ok: true });
});

app.post("/broadcast/delete", (req, res) => {
  const room = String(req.body.room_id);
  if (!room || room === "undefined") {
    console.log("⚠️ broadcast/delete missing room_id");
    return res.status(400).json({ error: "missing room_id" });
  }
  console.log("📢 HTTP broadcast/delete ->", room);
  io.to(room).emit("delete_message", { id: Number(req.body.id) });
  res.json({ ok: true });
});

server.listen(3001, "0.0.0.0", () => {
  console.log("✅ Socket server running on :3001");
});