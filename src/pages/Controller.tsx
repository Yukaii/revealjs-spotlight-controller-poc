import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket;

export const Controller = () => {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [serverState, setServerState] = useState<{
    isCalibrated: boolean;
    calibrateStep: number;
    isCalibrating: boolean;
  }>({
    isCalibrated: false,
    calibrateStep: 0,
    isCalibrating: false,
  });

  console.log(serverState);

  const [deviceOrientation, setDeviceOrientation] = useState<{
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
  }>({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });

  useEffect(() => {
    socket = io("http://localhost:3000");

    socket.on("connect", () => {
      socket.emit("clientData", {
        isController: true,
      });
    });

    socket.on("serverState", (data) => {
      setServerState(data.serverState);
    });

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const { alpha, beta, gamma } = e;
      setDeviceOrientation({ alpha, beta, gamma });
    };

    window.addEventListener("deviceorientation", handleOrientation, true);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      socket.disconnect();
    };
  }, []);

   const handleCalibrationStart = () => {
    setIsCalibrating(true);
    socket.emit('startCalibration');
  };

  const handleButtonPress = () => {
    if (isCalibrating) {
      socket.emit('calibrationData', deviceOrientation);
    } else {
      socket.emit('deviceOrientation', deviceOrientation);
    }
  };

  return <div className='bg-zinc-700 flex flex-col items-center justify-center h-screen'>
    {/* centered circle for hoding down */}
    <div className='w-40 h-40 rounded-full bg-zinc-500 flex items-center justify-center'>
      <button
        className='w-32 h-32 rounded-full bg-zinc-700 outline-none focus:outline-none border-none active:bg-zinc-500 active:border-solid'
        onMouseDown={handleButtonPress}
        onMouseUp={handleButtonPress}
      />
    </div>
  </div>;
};

export default Controller;
