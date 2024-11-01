"use client";

import { useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";

const ResumeTour = () => {
  const [runTour, setRunTour] = useState(true);

  const steps: Step[] = [
    {
      target: "body",
      content: "Welcome to Resume Manager! Let us show you around.",
      placement: "center",
      disableBeacon: true,
    },
    {
      target: '.sidebar',
      content: 'Here are all the Feature in the Application',
      placement: 'left',
    },
    {
      target: ".upload-section",
      content:
        "Upload new resumes by dragging and dropping files here or clicking to browse.",
      placement: "left",
    },
    {
      target: ".analyze-button",
      content: "View and Analyze your resume by clicking this .",
      placement: "right",
    },
    {
      target: ".delete-button",
      content: "You can delete any resume by clicking this button.",
      placement: "left",
    },

  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data as { status: STATUS };
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
      // You could save this preference to localStorage or your backend
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("resumeTourComplete", "true");
      }
    }
  };

  // Don't show tour if it's already been completed
    if (typeof localStorage !== "undefined" && localStorage.getItem('resumeTourComplete') === 'true') {
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

export default ResumeTour;
