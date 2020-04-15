const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const cors = require("cors");

const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");

const router = require("./router");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(cors());
app.use(router);

let activeSockets = []; // VIDEOCHAT ACTIVE SOCKETS

io.on("connection", (socket) => {
  const existingSocket = activeSockets.find(
    (existingSocket) => existingSocket === socket.id
  );

  if (!existingSocket) {
    activeSockets.push(socket.id);

    socket.emit("update-user-list", {
      users: activeSockets.filter(
        (existingSocket) => existingSocket !== socket.id
      ),
    });

    socket.broadcast.emit("update-user-list", {
      users: [socket.id],
    });

    socket.on("disconnect", () => {
      activeSockets = activeSockets.filter(
        (existingSocket) => existingSocket !== socket.id
      );
      socket.broadcast.emit("remove-user", {
        socketId: socket.id,
      });
    });
  }
});

io.on("connect", (socket) => {
  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);

    socket.join(user.room);

    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to room ${user.room}.`,
    });
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name} has joined!` });

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    let date = new Date();
    let time = `${date.getHours()}:${date.getMinutes()}`;

    io.to(user.room).emit("message", { user: user.name, text: message, time });

    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", {
        user: "Admin",
        text: `${user.name} has left.`,
      });
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });

  ////////// LISTENERS FOR REALISATION VIDEO CHAT //////////////

  const existingSocket = activeSockets.find(
    (existingSocket) => existingSocket === socket.id
  );

  if (!existingSocket) {
    activeSockets.push(socket.id);

    socket.emit("update-user-list", {
      users: activeSockets.filter(
        (existingSocket) => existingSocket !== socket.id
      ),
    });

    socket.broadcast.emit("update-user-list", {
      users: [socket.id],
    });
  }

  socket.on("call-user", (data) => {
    socket.to(data.to).emit("call-made", {
      offer: data.offer,
      socket: socket.id,
    });
  });

  socket.on("make-answer", (data) => {
    socket.to(data.to).emit("answer-made", {
      socket: socket.id,
      answer: data.answer,
    });
  });

  socket.on("reject-call", (data) => {
    socket.to(data.from).emit("call-rejected", {
      socket: socket.id,
    });
  });

  socket.on("disconnect", () => {
    activeSockets = activeSockets.filter(
      (existingSocket) => existingSocket !== socket.id
    );
    socket.broadcast.emit("remove-user", {
      socketId: socket.id,
    });
  });
});

server.listen(process.env.PORT || 5000, () =>
  console.log(`Server has started.`)
);
