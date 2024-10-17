require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./src/routes/auth');
const scrapeRoutes = require('./src/routes/scrape');
const razorpayRoutes = require('./src/routes/razorpay');
const Razorpay = require("razorpay");
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);

// Add CORS options to allow requests from the frontend (localhost:3000)
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Allow your frontend origin
    methods: ["GET", "POST"], // Allow specific methods
    allowedHeaders: ["Content-Type"], // Allow specific headers
    credentials: true // Allow credentials (cookies, etc.)
  }
});

// middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true })); // CORS for REST API
app.use(cookieParser());
app.use('/auth', authRoutes);
app.use('/scrape', scrapeRoutes);
app.use('/razorpay', razorpayRoutes);


app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Razorpay order route
app.post("/create-order", async (req, res) => {
  const { amount } = req.body;
  try {
    const options = {
      amount: amount,
      currency: "INR",
      receipt: "order_rcptid_11",
    };
    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Define a schema and model for posts (discussion forum)
const postSchema = new mongoose.Schema({
  content: String,
  username: String, // Store the username of the post creator
  replies: [{ 
    content: String, 
    username: String, // Store the username of the reply creator
    createdAt: { type: Date, default: Date.now } 
  }],
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model("Post", postSchema);

// API endpoint to get posts
app.get("/api/posts", async (req, res) => {
  const posts = await Post.find();
  res.json(posts);
});

// API endpoint to create a new post
app.post("/api/posts", async (req, res) => {
  const { content, username } = req.body; // Accept the username
  const newPost = new Post({ content, username }); // Include the username
  await newPost.save();
  io.emit("newPost", newPost); // Emit new post event with the username
  res.json(newPost);
});

// API endpoint to reply to a post
app.post("/api/posts/:id/reply", async (req, res) => {
  const { content, username } = req.body; // Accept the username
  const post = await Post.findById(req.params.id);

  const newReply = { content, username, createdAt: new Date() }; // Include the username in replies
  post.replies.push(newReply);
  await post.save();

  io.emit("newReply", post); // Emit the updated post with new reply
  res.json(post);
});

// Route to delete a specific post by ID
app.delete('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedPost = await Post.findByIdAndDelete(id);
    if (!deletedPost) {
      return res.status(404).send('Post not found');
    }
    io.emit("deletedPost", id); // Emit event for post deletion
    res.status(200).send(deletedPost);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// Routes for authentication, scraping, and Razorpay
// Connect to DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('connected to database');
    // listen to port
    server.listen(process.env.PORT, () => {
      console.log('listening for requests on port', process.env.PORT);
    });
  })
  .catch((err) => {
    console.log(err);
  });

// Socket.io connection event
io.on("connection", (socket) => {
  console.log("New client connected");

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});