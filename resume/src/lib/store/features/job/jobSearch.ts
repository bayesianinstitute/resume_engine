// redux/jobSlice.ts
import { Job, searchJobApi } from "@/types/job";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../store";
// import { format } from "date-fns";


export interface SearchJob {
  jobTitle: string | null;
  jobLocation: string | null;
  datePosted: Date; // Update to allow null values
}



interface JobsState {
  jobs: Job[];
  interResumejobs:Job[]
  totalJobs: number;
  loading: boolean;
  error: string | null;
  jobTitle: string; // Add jobTitle to state
  jobLocation: string; // Add jobLocation to state
  datePosted: string;
  currentPage: number;
  reset: boolean;
  isSearch: boolean; // New flag for search status
}

const initialState: JobsState = {
  jobs: [],
  interResumejobs: [],
  totalJobs: 0,
  loading: false,
  error: null,
  jobTitle: '', // Initialize as empty string
  jobLocation: '', // Initialize as empty string
  datePosted: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
  currentPage:1,
  reset:true,
  isSearch:false
};

export const searchJobs = createAsyncThunk(
  "jobs/searchJobs",
  async (_, { getState }) => {
    const state = getState() as RootState;
    const { jobTitle, jobLocation, datePosted } = state.jobs; // Destructure from state

    const date=datePosted ? datePosted.toString() : null
    
    // Prepare the search parameters for the request body
    const searchParams = {
      title: jobTitle,
      location: jobLocation || null,
      datePosted: date ,
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

    const data:searchJobApi = await response.json();

    if(!data.success) throw new Error("Failed to search jobs");
    console.log(data.message,data.data);

    
    return { joblists: data.data.joblists, totalJoblists: data.data.totalJoblists }; // Adjusted to match your API response
  }
);


export const clearSearch = createAsyncThunk(
  "jobs/clearSearch",
  async (_, { dispatch }) => {
    dispatch(setJobTitle(''));
    dispatch(setJobLocation(''));
    dispatch(setDatePosted(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString())); // One month ago as an ISO string
  }
);

export const 
fetchJobs = createAsyncThunk(
  "jobs/fetchJobs",
  async ({ page, limit = 10 }: { page: number; limit: number }, {  rejectWithValue }) => {

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

export const fetchResumeJobs = createAsyncThunk(
  "jobs/fetchResumeJobs",
  async ({ page, limit = 10 }: { page: number; limit: number }, {  rejectWithValue }) => {

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
    setDatePosted(state, action: PayloadAction<string>) {
      state.datePosted = action.payload;
    },
    setReset(state, action: PayloadAction<boolean>) {
      state.reset = action.payload; // Directly set reset value for search
    },
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload; // Update currentPage when changing pages
    },
    addJobb(state, action: PayloadAction<Job[]>) {
      for (const job of action.payload) {
        state.jobs.push(job);
        state.totalJobs += 1; // Increment totalJobs for each added job
      }
    },
    setIsSearch(state, action: PayloadAction<boolean>) {
      state.isSearch = action.payload;
    },
  },
  
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResumeJobs.fulfilled, (state, action: PayloadAction<{ joblists: Job[], totalJoblists: number }>) => {
        // Remove duplicates before merging
        const uniqueJobs = action.payload.joblists.filter(job => 
          !state.jobs.some(existingJob => existingJob._id === job._id)
        );
        state.interResumejobs = [...state.jobs, ...uniqueJobs];
        state.totalJobs = action.payload.totalJoblists;
        state.loading = false;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchJobs.fulfilled, (state, action: PayloadAction<{ joblists: Job[], totalJoblists: number }>) => {
        const uniqueJobs = action.payload.joblists.filter(job => 
          !state.jobs.some(existingJob => existingJob._id === job._id)
        );
        state.jobs = [...state.jobs, ...uniqueJobs];

        // state.jobs=action.payload.joblists
        state.totalJobs = action.payload.totalJoblists;
        state.loading = false;
      })
      .addCase(searchJobs.fulfilled, (state, action: PayloadAction<{ joblists: Job[], totalJoblists: number }>) => {
        state.jobs = action.payload.joblists;
        state.totalJobs = action.payload.totalJoblists;
        state.loading = false;
 
      });
  },
});

export const { setJobTitle, setJobLocation, setDatePosted,setReset,setCurrentPage,addJobb,setIsSearch } = jobSlice.actions;

export default jobSlice.reducer;
