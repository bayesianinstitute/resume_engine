// redux/jobSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../store";

interface SearchJob {
  jobTitle: string | null;
  jobLocation: string | null;
  datePosted: string | null; // Update to allow null values
}

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
  jobTitle: string; // Add jobTitle to state
  jobLocation: string; // Add jobLocation to state
  datePosted: Date | null; // Add datePosted to state
}

const initialState: JobsState = {
  jobs: [],
  totalJobs: 0,
  loading: false,
  error: null,
  jobTitle: '', // Initialize as empty string
  jobLocation: '', // Initialize as empty string
  datePosted: null, // Initialize as null
};

export const searchJobs = createAsyncThunk(
  "jobs/searchJobs",
  async (_, { getState }) => {
    const state = getState() as RootState;
    const { jobTitle, jobLocation, datePosted } = state.jobs; // Destructure from state
    const filteredJobs = state.jobs.jobs.filter((job) => {
      return (
        (jobTitle ? job.title.includes(jobTitle) : true) &&
        (jobLocation ? job.location.includes(jobLocation) : true) &&
        (datePosted ? job.datePosted === datePosted : true)
      );
    });
    return { joblists: filteredJobs, totalJoblists: filteredJobs.length };
  }
);

export const clearSearch = createAsyncThunk(
  "jobs/clearSearch",
  async (_, { dispatch }) => {
    dispatch(fetchJobs(1));
  }
);

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
  reducers: {
    setJobTitle(state, action: PayloadAction<string>) {
      state.jobTitle = action.payload;
    },
    setJobLocation(state, action: PayloadAction<string>) {
      state.jobLocation = action.payload;
    },
    setDatePosted(state, action: PayloadAction<Date | null>) {
      state.datePosted = action.payload;
    },
  },
  
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
      })
      .addCase(searchJobs.fulfilled, (state, action: PayloadAction<{ joblists: Job[], totalJoblists: number }>) => {
        state.jobs = action.payload.joblists;
        state.totalJobs = action.payload.totalJoblists;
      });
  },
});

export const { setJobTitle, setJobLocation, setDatePosted } = jobSlice.actions;

export default jobSlice.reducer;
