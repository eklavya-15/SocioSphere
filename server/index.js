import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import http from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/posts.js";
import { verifyToken } from "./middleware/auth.js";
import aws  from 'aws-sdk';
import multerS3 from 'multer-s3';
import messageRoutes from "./routes/messages.js";
import User from "./models/User.js";
import Post from "./models/Post.js";
import Message from "./models/Message.js"; // Import Message model

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors(
  {
    origin: ['/'],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  }
));
// app.use("/assets", express.static(path.join(__dirname, "public/assets")));
aws.config.update({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: 'ap-south-1', // e.g., us-east-1
});

const s3 = new aws.S3();
const myBucket = process.env.BUCKET;

/* FILE STORAGE */
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/assets");
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname);
//   },
// });
// const upload = multer({ storage });
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: myBucket,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (request, file, cb) {
      cb(null, file.originalname);
    },
  }),
});

/* ROUTES WITH FILES */
app.post("/auth/register", upload.single("picture"), register);
app.post("/posts", verifyToken, upload.single("picture"), createPost);

/* ROUTES */
app.use("/auth", authRoutes); 
app.use("/users", userRoutes);
app.use("/posts", postRoutes);
app.use("/messages", messageRoutes); // Use message routes

/* SOCKET.IO SETUP */
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("send_message", (data) => {
    const { senderId, recipientId, content, timestamp } = data;

    // Save the message to the database
    const newMessage = new Message({
      senderId,
      recipientId,
      content,
      timestamp,
    });

    newMessage.save().then(() => {
      // Emit the message to the recipient
      io.emit(`receive_message_${recipientId}`, data);
      io.emit(`receive_message_${senderId}`, data); // For sender to update their chat
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 6001;
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    server.listen(PORT, () => console.log(`Server Port: ${PORT}`));

    /* ADD DATA ONE TIME */
    // User.insertMany(users);
    // Post.insertMany(posts);
  })
  .catch((error) => console.log(`${error} did not connect`));
