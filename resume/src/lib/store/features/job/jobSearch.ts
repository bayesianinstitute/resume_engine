// redux/jobSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../store";
import { Job } from "@/types/job";
// import { format } from "date-fns";


export interface SearchJob {
  jobTitle: string | null;
  jobLocation: string | null;
  datePosted: Date; // Update to allow null values
}



interface JobsState {
  jobs: Job[];
  totalJobs: number;
  loading: boolean;
  error: string | null;
  jobTitle: string; // Add jobTitle to state
  jobLocation: string; // Add jobLocation to state
  datePosted: Date ; // Add datePosted to state
  currentPage: number;
}

const initialState: JobsState = {
  jobs: [],
  totalJobs: 0,
  loading: false,
  error: null,
  jobTitle: '', // Initialize as empty string
  jobLocation: '', // Initialize as empty string
  datePosted: new Date(), // Set current date
  currentPage:1
};

export const searchJobs = createAsyncThunk(
  "jobs/searchJobs",
  async (_, { getState }) => {
    const state = getState() as RootState;
    const { jobTitle, jobLocation, datePosted } = state.jobs; // Destructure from state
    
    // Prepare the search parameters for the request body
    const searchParams = {
      title: jobTitle,
      location: jobLocation || null,
      datePosted: datePosted.toISOString() ,
    };

    // Send the search parameters in the request body
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/job/search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      }
    );

    if (!response.ok) throw new Error("Failed to search jobs");

    const data = await response.json();
    return { joblists: data, totalJoblists: data.length }; // Adjusted to match your API response
  }
);


export const clearSearch = createAsyncThunk(
  "jobs/clearSearch",
  async (_, { dispatch }) => {
    dispatch(fetchJobs({ page: 1, limit: 10 }));
  }
);

export const fetchJobs = createAsyncThunk(
  "jobs/fetchJobs",
  async ({ page, limit = 10 }: { page: number; limit: number }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/job/list?page=${page}&limit=${limit}`
      );

      if (!response.ok) throw new Error("Failed to fetch jobs");

      const data = await response.json();
      return data;
    } catch (error) {
      console.log("error", error);
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
    setDatePosted(state, action: PayloadAction<Date>) {
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
        // Remove duplicates before merging
        const uniqueJobs = action.payload.joblists.filter(job => 
          !state.jobs.some(existingJob => existingJob._id === job._id)
        );
        state.jobs = [...state.jobs, ...uniqueJobs];
        state.totalJobs = action.payload.totalJoblists;
        state.loading = false;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(searchJobs.fulfilled, (state, action: PayloadAction<{ joblists: Job[], totalJoblists: number }>) => {
        console.log(action.payload.joblists)
        console.log(action.payload.totalJoblists)
        state.jobs = action.payload.joblists;
        state.totalJobs = action.payload.totalJoblists;
        state.loading = false;
 
      });
  },
});

export const { setJobTitle, setJobLocation, setDatePosted } = jobSlice.actions;

export default jobSlice.reducer;
