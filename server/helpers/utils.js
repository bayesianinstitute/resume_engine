export const isValidJSON = (text) => {
  try {
    JSON.parse(text);
    return true;
  } catch {
    console.log("it is not a valid JSON");
    return false;
  }
};

export const checkAndResetApiRequestCount = () => {
  const currentTime = Date.now();
  const timeElapsed = currentTime - lastRequestTimestamp;

  if (timeElapsed >= 60000) {
    // If more than 60 seconds have passed
    apiRequestCount = 0; // Reset the counter
    lastRequestTimestamp = currentTime; // Update the timestamp
  }
};
