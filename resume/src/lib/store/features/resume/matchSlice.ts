import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { MatchResult, MatchResultResponse } from "@/types/matcher";
import { RootState } from "../../store";

interface JobMatchState {
  matchResults: MatchResult[];
  loading: boolean;
  error: string | null;
}

const initialState: JobMatchState = {
  matchResults: [],
  loading: false,
  error: null,
};

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

    return Array.isArray(data.results) ? data.results : [];
    return data.results;
  }
);

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
      const currentJobIds = new Set(state.matchResults.map(result => result.jobId));

      newResults.forEach(newResult => {
        if (!currentJobIds.has(newResult.jobId)) {
          state.matchResults.push(newResult);
          currentJobIds.add(newResult.jobId);
          console.log("Added new result U:", newResult);
        } else {
          console.log("Duplicate result ignored U:", newResult);
        }
      });
      state.loading = false;
    },
  },

// In jobMatchSlice, update reducers with a type check
extraReducers: (builder) => {
  builder
    .addCase(fetchMatchResults.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchMatchResults.fulfilled, (state, action: PayloadAction<MatchResult[]>) => {
      const newResults = action.payload;
      const currentJobIds = new Set(state.matchResults.map(result => result.jobId));

      if (Array.isArray(newResults)) {  // Ensure newResults is an array
        newResults.forEach(newResult => {
          if (!currentJobIds.has(newResult.jobId)) {
            state.matchResults.push(newResult);
            currentJobIds.add(newResult.jobId);
          }
        });
      } else {
        console.error("Expected newResults to be an array, got:", newResults);
      }

      state.loading = false;
    })
    .addCase(fetchMatchResults.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch match results";
    });
}
});

export const { setMatchResults, clearMatchResults, updateMatchResultProgress } = jobMatchSlice.actions;
export const selectMatchResults = (state: RootState) => state.jobMatch.matchResults;
export const selectMatchLoading = (state: RootState) => state.jobMatch.loading;
export const selectMatchError = (state: RootState) => state.jobMatch.error;

export default jobMatchSlice.reducer;
