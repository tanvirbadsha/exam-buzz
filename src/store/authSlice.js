import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  role: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload?.user || null;
      state.role = action.payload?.role || null;
      state.token = action.payload?.token || state.token || null;
      state.isAuthenticated = true;
    },
    clearCredentials: () => ({ ...initialState }),
  },
});

export const { clearCredentials, setCredentials } = authSlice.actions;
export const logout = clearCredentials;

export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentRole = (state) => state.auth.role;
export const selectCurrentToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export default authSlice.reducer;
