// redux/jobSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface Job {
  _id: string;
  title: string;
  location: string;
  datePosted: string;
  experienceLevel: string;
  description: string;
  url: string;
}

interface JobsState {
  jobs: Job[];
  totalJobs: number;
  loading: boolean;
  error: string | null;
}

const initialState: JobsState = {
  jobs: [],
  totalJobs: 0,
  loading: false,
  error: null,
};

export const fetchJobs = createAsyncThunk(
  "jobs/fetchJobs",
  async (page: number, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/job/list?page=${page}&limit=10`
      );

      if (!response.ok) throw new Error("Failed to fetch jobs");

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue("Failed to fetch jobs. Please try again.");
    }
  }
);

const jobSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action: PayloadAction<{ joblists: Job[], totalJoblists: number }>) => {
        state.jobs = action.payload.joblists;
        state.totalJobs = action.payload.totalJoblists;
        state.loading = false;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default jobSlice.reducer;
