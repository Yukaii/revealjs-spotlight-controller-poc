import { useEffect, useMemo, useState } from "react";
import cx from "classnames";
import { io, Socket } from "socket.io-client";
import { useDeviceOrientation } from '../hooks/useDeviceOrientation'

let socket: Socket;

const useStateRef = <T extends any>(initialState: T) => {
  const [state, setState] = useState(initialState);
  const stateRef = useMemo(() => {
    return {
      current: state,
    };
  }, [state]);

  return [state, setState, stateRef] as const;
};

export const Controller = () => {
  const [isPointingHold, setIsPointingHold, isPointingHoldRef] = useStateRef(false)
  const [serverState, setServerState] = useState<{
    isCalibrated: boolean;
    calibrateStep: number;
    isCalibrating: boolean;
  }>({
    isCalibrated: false,
    calibrateStep: 0,
    isCalibrating: false,
  });

  const { orientation: deviceOrientation, requestAccess, revokeAccess } = useDeviceOrientation()

  console.log(deviceOrientation)

  useEffect(() => {
    console.log('requesting access')
    requestAccess()
    return () => {
      revokeAccess()
    }
  }, [])

  const handleCalibrationStart = () => {
    socket.emit("startCalibration");
  };

  const emitDeviceOrientation = () => {
    socket.emit("deviceOrientation", deviceOrientation);
  };

  const emitCalibrationData = () => {
    socket.emit("calibrationData", deviceOrientation);
  };

  useEffect(() => {
    if (isPointingHoldRef.current) {
      emitDeviceOrientation();
    }
  }, [deviceOrientation, emitDeviceOrientation, isPointingHoldRef])

  useEffect(() => {
    socket = io("http://192.168.135.130:3000");

    socket.on("connect", () => {
      socket.emit("clientData", {
        isController: true,
      });
    });

    socket.on("serverState", (data) => {
      setServerState(data.serverState);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-full bg-zinc-700">
      {/* centered circle for hoding down */}
      <div className="flex justify-center items-center w-40 h-40 rounded-full bg-zinc-500">
        <button
          className="w-32 h-32 rounded-full border-none outline-none focus:outline-none active:border-solid bg-zinc-700 active:bg-zinc-500"
          onTouchStart={() => {
            setIsPointingHold(true);
          }}
          onTouchEnd={() => {
            setIsPointingHold(false);
          }}
          onMouseDown={() => {
            setIsPointingHold(true);
          }}
          onMouseUp={() => {
            setIsPointingHold(false);
          }}
        />
      </div>

      {/* bottom right calibration button */}
      <button
        className="absolute right-0 bottom-0 w-20 h-20 rounded-sm border-none outline-none focus:outline-none active:border-solid bg-zinc-500 active:bg-zinc-700"
        onClick={handleCalibrationStart}
      >
        {serverState.isCalibrating ? "Stop" : "Calibrate"}
      </button>

      {/* Calibration UI */}
      {serverState.isCalibrating && (
        <div className="flex absolute top-0 left-0 flex-col w-full h-full bg-zinc-700">
          {/* control buttons */}
          <div className="grid grid-cols-2 grid-rows-2 w-full h-full bg-zinc-700">
            {/* show four arrow key button pointing to top-left, top-right, bottom-left, bottom-right, simulate the four corner of screen */}
            {/* Each row has two buttons */}
            {new Array(4).fill(0).map((_, i) => {
              const isActive = serverState.calibrateStep === i;
              const arrowSvg = (
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2l-8 8h6v12h4V10h6z" className="fill-current" />
                </svg>
              );

              const rotate = (() => {
                switch (i) {
                  case 0:
                    return -45;
                  case 1:
                    return 45;
                  case 2:
                    return -135;
                  case 3:
                    return 135;
                  default:
                    return 0;
                }
              })();

              return (
                <div className="flex justify-center items-center">
                  <button
                    className={cx(
                      "flex justify-center items-center w-20 h-20 rounded-sm rounded-full outline-none focus:outline-none bg-transparent border-none",
                      {
                        "border-red-500 border-solid": isActive,
                      }
                    )}
                  >
                    <div
                      className={cx("w-12 h-12", {
                        "animate-pulse": isActive,
                      })}
                      style={{
                        transform: `rotate(${rotate}deg)`,
                        transformOrigin: "center center",
                      }}
                    >
                      {arrowSvg}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Controll button used in calibration */}
          <div className='py-5'>
            <div className="flex flex-col justify-center items-center w-full bg-zinc-700 gap-2">
              <small className="text-white">
                Point your phone to the corner of the screen
              </small>
              <button
                onClick={emitCalibrationData}
              >
                Press to calibrate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Controller;
