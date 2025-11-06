import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LikesState {
  likes: Record<string, number>;
}

const initialState: LikesState = {
  likes: {},
};

const likesSlice = createSlice({
  name: 'likes',
  initialState,
  reducers: {
    addLike: (state, action: PayloadAction<string>) => {
      const modelId = action.payload;
      state.likes[modelId] = (state.likes[modelId] || 0) + 1;
    },
  },
});

export const { addLike } = likesSlice.actions;
export default likesSlice.reducer;