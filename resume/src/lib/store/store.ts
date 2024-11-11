import { configureStore } from '@reduxjs/toolkit'
import jobDescriptionReducer from './features/job/jobSlice'
import jobReducer from "./features/job/jobSearch";
import authReducer from "./features/user/user";
import resumeReducer from './features/resume/resumeSlice';
import jobMatchReducer from './features/resume/matchSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      // Define your reducers here

      //user Slice
      auth: authReducer,

      //Resume Slice
      resume: resumeReducer,

      // Job Slice
      jobDescription: jobDescriptionReducer,
      jobs: jobReducer,

      // Match Slice
      jobMatch: jobMatchReducer,

    }
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']