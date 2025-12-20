import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("✅ connected:", socket.id);

  socket.on("join_room", (room) => {
    socket.join(String(room));
    console.log("JOIN", room);
  });

  socket.on("leave_room", (room) => {
    socket.leave(String(room));
    console.log("LEAVE", room);
  });
});

app.post("/broadcast/chat", (req, res) => {
  const room = String(req.body.room_id);
  console.log("📢 broadcast/chat ->", room);
  io.to(room).emit("receive_message", req.body);
  res.json({ ok: true });
});

app.post("/broadcast/delete", (req, res) => {
  const room = String(req.body.room_id);
  console.log("📢 broadcast/delete ->", room);
  io.to(room).emit("delete_message", { id: Number(req.body.id) });
  res.json({ ok: true });
});

server.listen(3001, "0.0.0.0", () => {
  console.log("✅ Socket server running on :3001");
});
