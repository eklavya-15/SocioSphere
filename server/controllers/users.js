import User from "../models/User.js";

/* READ */
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserFriends = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate('friends');

    const friends = await Promise.all(
      user.friends.map((id) => User.findById(id))
    );
    const formattedFriends = friends&&friends.map(
      ({ _id, firstName, lastName, occupation, location, picturePath }) => {
        return { _id, firstName, lastName, occupation, location, picturePath };
      }
    );
    res.status(200).json(formattedFriends);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE */
export const addRemoveFriend = async (req, res) => {
  try {
    const { id, friendId } = req.params;
    const user = await User.findById(id);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure IDs are strings for comparison
    const userIdStr = id.toString();
    const friendIdStr = friendId.toString();

    // Check if friend is already in the friends list
    const isFriend = user.friends.includes(friendIdStr);

    if (isFriend) {
      // Remove friend from user's friends list
      user.friends = user.friends.filter(fid => fid.toString() !== friendIdStr);
      friend.friends = friend.friends.filter(fid => fid.toString() !== userIdStr);
    } else {
      // Add friend to user's friends list
      user.friends.push(friendIdStr);
      friend.friends.push(userIdStr);
    }

    await user.save();
    await friend.save();

    const friends = await Promise.all(
      user.friends.map(friendId => User.findById(friendId))
    );

    const formattedFriends = friends.map(({ _id, firstName, lastName, occupation, location, picturePath }) => ({
      _id,
      firstName,
      lastName,
      occupation,
      location,
      picturePath,
    }));

    res.status(200).json(formattedFriends);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
