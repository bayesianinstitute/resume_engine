// src/store/features/resume/resumeSlice.ts
import { Resume, ResumeApiResponse } from "@/types/resume";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ResumeState {
  resumes: Resume[];
  selectedResume: Resume | null;
  errorMessage: string | null;
  loading: boolean;
}

const initialState: ResumeState = {
  resumes: [],
  selectedResume: null,
  errorMessage: null,
  loading: false,
};

// Async thunk to fetch all resumes
export const fetchResumes = createAsyncThunk<ResumeApiResponse, string>(
  "resume/fetchResumes",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/resume/getAllResumes?userId=${userId}`
      );
      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || "Failed to fetch resumes");
      }
      return await response.json();
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message || "An unknown error occurred");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

const resumeSlice = createSlice({
  name: "resume",
  initialState,
  reducers: {
    setResumes(state, action: PayloadAction<Resume[]>) {
      state.resumes = action.payload;
    },
    setSelectedResume(state, action: PayloadAction<Resume | null>) {
      state.selectedResume = action.payload;
    },
    setErrorMessage(state, action: PayloadAction<string | null>) {
      state.errorMessage = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResumes.pending, (state) => {
        state.loading = true;
        state.errorMessage = null;
      })
      .addCase(fetchResumes.fulfilled, (state, action) => {
        // Ensure the payload contains the array of resumes
        // console.log(action.payload);
        if (action.payload && Array.isArray(action.payload.data)) {
          state.resumes = action.payload.data; // Explicitly assign the resumes
        } else {
          state.resumes = []; // Fallback in case of unexpected payload structure
        }
        state.loading = false;
      })
      .addCase(fetchResumes.rejected, (state, action) => {
        state.loading = false;
        state.errorMessage = action.payload as string;
      });
  },
});

export const { setResumes, setSelectedResume, setErrorMessage, setLoading } =
  resumeSlice.actions;
export default resumeSlice.reducer;
