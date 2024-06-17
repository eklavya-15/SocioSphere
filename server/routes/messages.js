import express from "express";
import { getUnseenMessages, markMessagesAsSeen, getMessages, sendMessage } from "../controllers/messages.js";

const router = express.Router();

// Fetch unseen messages count for each friend
router.get("/:userId/unseen", getUnseenMessages);

// Mark messages as seen and reset unseen count
router.patch("/:userId/:friendId/mark-seen", markMessagesAsSeen);

// Fetch messages between two users
router.get("/:userId/:friendId", getMessages);

// Send a new message
router.post("/", sendMessage);

export default router;