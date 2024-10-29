import { configureStore } from '@reduxjs/toolkit'
import jobDescriptionReducer from './features/job/jobSlice'
import jobReducer from "./features/job/jobSearch";

export const makeStore = () => {
  return configureStore({
    reducer: {
      // Define your reducers here
      jobDescription: jobDescriptionReducer,
      jobs: jobReducer,

    }
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']