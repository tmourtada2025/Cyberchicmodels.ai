import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  specialty?: string;
  description?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
}

const initialState: CartState = {
  items: [],
  total: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (!existingItem) {
        const itemToAdd = {
          ...action.payload,
          // Ensure we have a valid price
          price: action.payload.price || 1.99
        };
        state.items.push(itemToAdd);
        state.total += itemToAdd.price;
      }
    },
    removeFromCart: (state, action: PayloadAction<string | number>) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item) {
        state.total -= item.price;
        state.items = state.items.filter(item => item.id !== action.payload);
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
    },
  },
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;