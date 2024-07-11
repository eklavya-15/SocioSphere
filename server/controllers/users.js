import express from "express";
import mongoose from "mongoose";
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
      user.friends.map((friendId) => User.findById(friendId))
    );
    const formattedFriends = friends && friends.map(
      ({ _id, firstName, lastName, bio, picturePath }) => {
        return { _id, firstName, lastName, bio, picturePath };
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

    const formattedFriends = friends.map(({ _id, firstName, lastName, bio, picturePath }) => ({
      _id,
      firstName,
      lastName,
      bio,
      picturePath,
    }));

    res.status(200).json(formattedFriends);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);

    // Ensure the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const { firsName, lasName, bi} = req.body;

    

    // Find user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user details based on the request body
    if (firsName) user.firstName = firsName;
    if (lasName) user.lastName = lasName;
    if (bi) user.bio = bi;

    // Save user and respond with updated user
    await user.save();
    res.status(200).json(user);

  } catch (err) {
    // Handle errors
    res.status(500).json({ message: err.message });
  }
};
