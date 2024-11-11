// authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import jwtDecode from 'jwt-decode';
import {jwtDecode} from 'jwt-decode'
interface AuthState {
  token: string | null;
  userId: string | null;
}

const initialState: AuthState = {
  token: null,
  userId: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      try {
        const decodedToken = jwtDecode<{ userId: string }>(action.payload);
        state.userId = decodedToken.userId || null;
      } catch (error) {
        console.error("Error decoding token:", error);
        state.userId = null;
      }
    },
    clearToken: (state) => {
      state.token = null;
      state.userId = null;
    },
  },
});

export const { setToken, clearToken } = authSlice.actions;
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export default authSlice.reducer;
