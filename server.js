import express from "express";
import { Server } from "socket.io";
import cors from "cors";

const port = 3000;
const app = express();

const corsOptions = {
  origin: true,
};

const server = app.listen(port, () =>
  console.log(`Listening on PORT: ${port}`)
);

app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.send("Server running!");
});

const production = process.env.NODE_ENV === "production";
const client = production
  ? "https://draw-match77-client.vercel.app"
  : "http://localhost:1234";
// const io = require("socket.io")(3000, {
//   cors: {
//     origin: client,
//   },
// });

const io = new Server(server, {
  cors: {
    origin: client,
    methods: ["GET"],
  },
});

const rooms = {};
console.log("production : ", production);
console.log("client : ", client);

//list random words of animal name and fruit names
//
const words = [
  "apple",
  "banana",
  "cherry",
  "date",
  "elderberry",
  "fig",
  "grape",
  "honeydew",
  "kiwi",
  "lemon",
  "chair",
  "desk",
  "lamp",
  "mirror",
  "painting",
  "pillow",
  "rug",
  "sofa",
  "table",
  "vase",
  "alpaca",
  "buffalo",
  "cheetah",
  "dingo",
  "elephant",
  "flamingo",
  "giraffe",
  "hippopotamus",
  "iguana",
  "jaguar",
];
io.on("connection", (socket) => {
  socket.on("join-room", (data) => {
    const user = { id: socket.id, name: data.name, socket: socket };
    // const user = {
    //   id: 123,
    //   name: "abhishek",
    //   socket: socket,
    // };
    let room = rooms[data.roomId];
    if (room == null) {
      room = { users: [], id: data.roomId };
      rooms[data.roomId] = room;
    }
    room.users.push(user);
    socket.join(room.id);
    socket.on("ready", () => {
      user.ready = true;
      if (room.users.every((u) => u.ready)) {
        room.word = getRandomEntry(words);
        room.guesser = getRandomEntry(room.users);
        io.to(room.guesser.id).emit("start-drawer", room.word);
        room.guesser.socket.to(room.id).emit("start-guesser");
      }
    });
    socket.on("make-guess", (data) => {
      socket.to(room.id).emit("guess", user.name, data.guess);
      if (data.guess.toLowerCase().trim() === room.word.toLowerCase()) {
        io.to(room.id).emit("winner", user.name, room.word);
        room.users.forEach((u) => {
          u.ready = false;
        });
      }
    });
    socket.on("draw", (data) => {
      socket.to(room.id).emit("draw-line", data.start, data.end);
    });
    socket.on("disconnect", () => {
      room.users = room.users.filter((user) => user !== user);
    });
  });
});

function getRandomEntry(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
