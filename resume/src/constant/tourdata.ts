import { Step } from "react-joyride";

export const resumeSteps: Step[] = [
  {
    target: "body",
    content: "Welcome to Resume Manager! Let us show you around.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: ".sidebar",
    content: "Here are all the Features in the Application",
    placement: "left",
  },
  {
    target: ".upload-section",
    content:
      "Upload new resumes by dragging and dropping files here or clicking to browse.",
    placement: "left",
  },
  {
    target: ".analyze-button",
    content: "View and Analyze your resume by clicking this.",
    placement: "right",
  },
  {
    target: ".delete-button",
    content: "You can delete any resume by clicking this button.",
    placement: "left",
  },
];

export const searchStep: Step[] = [
  {
    target: ".searchinput",
    content: "Enter keywords to find a resume by name, email, or job title.",
    placement: "left",
  },
  {
    target: ".joblist",
    content: "List of Job.",
    placement: "top",
  },
  {
    target: ".ViewDetails",
    content: "Click here to view the Job details.",
    placement: "bottom",
  },
  {
    target: ".Interview",
    content: "Click here to Generate prepare  Interview.",
    placement: "bottom",
  },
];

// export const InterviewStep: Step[] = [];