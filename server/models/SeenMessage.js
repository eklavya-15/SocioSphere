import mongoose from 'mongoose';

const seenMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  friendId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  count: { type: Number, default: 0 },
});

const SeenMessage = mongoose.model('SeenMessage', seenMessageSchema);
export default SeenMessage;