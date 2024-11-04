"use client";

import { useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";

interface TourProp{
  steps: Step[];
  name: string;
}

const Tour = ({steps,name}:TourProp ) => {
  const [runTour, setRunTour] = useState(true);

  

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;

    // Check status directly for each end state
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      // Save preference to localStorage
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(name, "true");
      }
    }
  };

  // Don't show tour if it's already been completed
  if (typeof localStorage !== "undefined" && localStorage.getItem(name) === 'true') {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#3b82f6",
          textColor: "#374151",
          zIndex: 1000,
        },
        buttonNext: {
          backgroundColor: "#3b82f6",
        },
        buttonBack: {
          marginRight: 10,
        },
      }}
    />
  );
};

export default Tour;
