import Message from "../models/Message.js";
import SeenMessage from "../models/SeenMessage.js";

// Fetch unseen messages count for each friend
export const getUnseenMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const unseenMessages = await SeenMessage.find({ userId });
    res.status(200).json(unseenMessages);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Mark messages as seen and reset unseen count
export const markMessagesAsSeen = async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    await SeenMessage.updateOne(
      { userId, friendId },
      { count: 0 },
      { upsert: true }
    );
    res.status(200).json({ message: "Messages marked as seen." });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Fetch messages between two users
export const getMessages = async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: userId, recipientId: friendId },
        { senderId: friendId, recipientId: userId },
      ],
    }).sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { senderId, recipientId, content, timestamp } = req.body;

    // Save the message to the database
    const newMessage = new Message({
      senderId,
      recipientId,
      content,
      timestamp,
    });

    await newMessage.save();

    // Update unseen messages count for recipient
    const unseenMsg = await SeenMessage.findOneAndUpdate(
      { userId: recipientId, friendId: senderId },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );

    // Emit the message to the recipient and sender
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { getUnseenMessages, markMessagesAsSeen, getMessages, sendMessage };