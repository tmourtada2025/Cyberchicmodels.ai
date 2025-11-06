import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { removeFromCart, clearCart } from '../store/cartSlice';
import { Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer } from './Footer';

export function CartPage() {
  const { items, total } = useSelector((state: RootState) => state.cart);
  const dispatch = useDispatch();

  const handleRemoveItem = (id: string | number) => {
    dispatch(removeFromCart(id));
  };

  const handleCheckout = () => {
    // Implement checkout logic here
    alert('Checkout functionality will be implemented soon!');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            <Link to="/" className="flex items-center text-gray-600 hover:text-black">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
          </div>

          <h1 className="text-4xl font-serif mb-8">Shopping Cart</h1>

          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-6">Your cart is empty</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  to="/models"
                  className="bg-black text-white px-6 py-2 rounded-full hover:bg-opacity-90"
                >
                  Browse Models
                </Link>
                <Link
                  to="/styles"
                  className="bg-rose-300 text-white px-6 py-2 rounded-full hover:bg-rose-400"
                >
                  Browse Styles
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div>
                        <h3 className="font-serif text-lg">{item.name}</h3>
                        <p className="text-gray-600">{item.specialty || item.description}</p>
                        <p className="text-gray-600">${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t pt-8">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xl font-serif">Total</span>
                  <span className="text-xl">${total.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => dispatch(clearCart())}
                    className="text-gray-600 hover:text-red-500"
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="bg-black text-white px-8 py-3 rounded-full hover:bg-opacity-90"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}