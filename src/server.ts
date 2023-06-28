import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";

// Create an express application
const app = express();
const httpServer = createServer(app);

// Create socket.io instance attached to the http server
const io = new Server(httpServer);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Event for receiving device orientation
  socket.on("deviceOrientation", (data) => {
    console.log("Received device orientation data:", data);

    // Here you would process the data and calculate the position of the pointer.
    // For simplicity, we are just broadcasting the data to all connected clients.
    socket.broadcast.emit("movePointer", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start the server
const port = process.env.PORT || 3000;
httpServer.listen(port, () => console.log(`Server is running on port ${port}`));
