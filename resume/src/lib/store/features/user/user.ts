// authSlice.ts
import {  UserInfo } from '@/types/user';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {jwtDecode} from 'jwt-decode'
interface AuthState {
  token: string | null;
  userId: string | null;
  userinfo: UserInfo | null;
}


const initialState: AuthState = {
  token: null,
  userId: null,
  userinfo:null,
  
};


const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      localStorage.setItem('token', action.payload ) 
      try {
        const decodedToken = jwtDecode<{ userId: string }>(action.payload);
        state.userId = decodedToken.userId || null;
      } catch (error) {
        console.error("Error decoding token:", error);
        state.userId = null;
      }
    },
    clearToken: (state) => {
      localStorage.removeItem('token');
      state.token = null;
      state.userId = null;
    },
    setUserData: (state, action: PayloadAction<UserInfo>) => {
      state.userinfo = action.payload;
    }
  },
});

export const { setToken, clearToken } = authSlice.actions;
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export default authSlice.reducer;
