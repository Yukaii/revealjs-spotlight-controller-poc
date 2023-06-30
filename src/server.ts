import express from "express";
import { Server, Socket } from "socket.io";
import { createServer } from "http";

// Create an express application
const app = express();
const httpServer = createServer(app);

// Create socket.io instance attached to the http server
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
} as any);

const clientIds = new Set();
const controllerIds = new Set();

// server state flags
// eslint-disable-next-line prefer-const
let isCalibrated = false;
let isCalibrating = false;
let calibrateStep = 0;

const calibrationData: {
  alpha: number;
  beta: number;
  gamma: number;
}[] = [];

const isSocketReady = (socket: Socket) => {
  const socketId = socket.id;
  const isClient = clientIds.has(socketId);
  const isController = controllerIds.has(socketId);
  const isClientOrController = isClient || isController;

  return socket.connected && !socket.disconnected && isClientOrController;
};

const syncServerState = (socket: Socket) => {
  const serverState = {
    isCalibrated,
    isCalibrating,
    calibrateStep,
  };

  socket.emit("serverState", {
    serverState,
  });
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  syncServerState(socket);

  // Event for receiving device orientation
  socket.on("deviceOrientation", (data) => {
    console.log("Received device orientation data:", data);

    // Here you would process the data and calculate the position of the pointer.
    // For simplicity, we are just broadcasting the data to all connected clients.
    socket.broadcast.emit("movePointer", data);
  });

  socket.on("startCalibration", () => {
    console.log("Received start calibration");
    isCalibrating = true;
    calibrateStep = 0;
    syncServerState(socket);
  });

  socket.on("calibrationData", (data) => {
    console.log("Received calibration data:", data);
    const { alpha, beta, gamma } = data || {};

    if (isCalibrating) {
      calibrationData[calibrateStep] = {
        alpha,
        beta,
        gamma,
      };

      calibrateStep += 1;
    }

    if (calibrateStep >= 3) {
      isCalibrating = false;
      isCalibrated = true;
      calibrateStep = 0;
    }

    syncServerState(socket);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    const socketId = socket.id;

    // remove socket from clientIds or controllerIds
    if (clientIds.has(socketId)) {
      clientIds.delete(socketId);
    } else if (controllerIds.has(socketId)) {
      controllerIds.delete(socketId);
    }
  });

  socket.on("clientData", (data) => {
    console.log("Received client data:", data);
    const { isController } = data || {};

    if (isController) {
      controllerIds.add(socket.id);
    } else {
      clientIds.add(socket.id);
    }

    console.log("clientIds:", clientIds);
    console.log("controllerIds:", controllerIds);
  });
});

app.use("*", (req, res) => {
  // catch all 404
  res.status(404).send("Not found");
});

// Start the server
const port = process.env.PORT || 3000;
httpServer.listen(port, () => console.log(`Server is running on port ${port}`));
