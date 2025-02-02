require("dotenv").config();
const express = require("express");
const usersMock = require("../../data/usersMock.js");
const jwt = require("jsonwebtoken");

const app = express.Router();

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: "Forbidden" });
      }
      req.user = user;
      next();
    });
  } else {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// Protected route: Get all users
app.get("/findAll", authenticateJWT, (req, res, next) => {
  try {
    res.json(usersMock.map(({ password, ...user }) => user));
  } catch (error) {
    next(error);
  }
});

app.delete("/delete/:id", authenticateJWT, (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = usersMock.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  usersMock.splice(userIndex, 1);
  res.json({ message: "User deleted successfully" });
});

// Protected route: Dashboard
app.get("/private/dashboard", authenticateJWT, (req, res, next) => {
  try {
    res.json({ message: `Welcome to the dashboard, ${req.user.email}` });
  } catch (error) {
    next(error);
  }
});

module.exports = app;
