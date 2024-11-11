import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { MatchResult, MatchResultResponse } from "@/types/matcher";
import { RootState } from "../../store";

interface JobMatchState {
  matchResults: MatchResult[];
  loading: boolean;
  error: string | null;
}

// Define initial state
const initialState: JobMatchState = {
  matchResults: [] as MatchResult[],
  loading: false,
  error: null,
};

// Async thunk for fetching match results from API
export const fetchMatchResults = createAsyncThunk(
  "jobMatch/fetchMatchResults",
  async ({ userId, resumeEntryIds, jobIds }: { userId: string; resumeEntryIds: string[]; jobIds: string[] }) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/resume/matcher`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, resumeEntryIds, jobIds }),
    });
    const data: MatchResultResponse = await response.json();
    if (!data.success) {
      throw new Error(data.message);
    }
    return data.results;
  }
);

// Create slice
const jobMatchSlice = createSlice({
  name: "jobMatch",
  initialState,
  reducers: {
    setMatchResults(state, action: PayloadAction<MatchResult[]>) {
      state.matchResults = action.payload;
    },
    clearMatchResults(state) {
      state.matchResults = [];
    },
    updateMatchResultProgress: (state, action: PayloadAction<MatchResult[]>) => {
      const newResults = action.payload;

      console.log("New match results:", newResults);
      console.log("Previous match results:", state.matchResults);
    
      // Check if matchResults is defined and is an array before pushing
      if (Array.isArray(state.matchResults)) {
        newResults.forEach((newResult) => {
          console.log("each result:", newResult);
          state.matchResults.push(newResult);
        });
      } else {
        console.error("state.matchResults is not an array");
      }
      state.loading = false;

      },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatchResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMatchResults.fulfilled, (state, action: PayloadAction<MatchResult[]>) => {
        const newResults = action.payload;

        console.log("New match results:", newResults);
        console.log("Previous match results:", state.matchResults);
      
        // Check if matchResults is defined and is an array before pushing
        if (Array.isArray(state.matchResults)) {
          newResults.forEach((newResult) => {
            console.log("each result:", newResult);
            state.matchResults.push(newResult);
          });
        } else {
          console.error("state.matchResults is not an array");
        }
  
        state.loading = false;
      })
      .addCase(fetchMatchResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch match results";
      });
  },
});

export const { setMatchResults, clearMatchResults,updateMatchResultProgress } = jobMatchSlice.actions;
export const selectMatchResults = (state: RootState) => state.jobMatch.matchResults;
export const selectMatchLoading = (state: RootState) => state.jobMatch.loading;
export const selectMatchError = (state: RootState) => state.jobMatch.error;

export default jobMatchSlice.reducer;
