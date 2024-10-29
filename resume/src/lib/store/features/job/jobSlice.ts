// store/jobDescriptionSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface JobDescriptionState {
  jobDescription: string;
  prepResources: PrepResource[];
  loading: boolean;
}

interface PrepResource {
  title: string;
  content: string;
  type: "topic" | "question" | "tip";
}

const initialState: JobDescriptionState = {
  jobDescription: '',
  prepResources: [],
  loading: false,
};

const jobDescriptionSlice = createSlice({
  name: 'jobDescription',
  initialState,
  reducers: {
    setJobDescription(state, action: PayloadAction<string>) {
      state.jobDescription = action.payload;
    },
    setPrepResources(state, action: PayloadAction<PrepResource[]>) {
      state.prepResources = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setJobDescription, setPrepResources, setLoading } = jobDescriptionSlice.actions;
export default jobDescriptionSlice.reducer;
