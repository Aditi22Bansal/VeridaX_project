import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

// Cart actions
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART'
};

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM:
      const existingItem = state.items.find(
        item => item.productId === action.payload.productId
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.productId === action.payload.productId
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
      }

      return {
        ...state,
        items: [...state.items, action.payload]
      };

    case CART_ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter(item => item.productId !== action.payload)
      };

    case CART_ACTIONS.UPDATE_QUANTITY:
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.productId !== action.payload.productId)
        };
      }

      return {
        ...state,
        items: state.items.map(item =>
          item.productId === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };

    case CART_ACTIONS.CLEAR_CART:
      return {
        ...state,
        items: []
      };

    case CART_ACTIONS.LOAD_CART:
      return {
        ...state,
        items: action.payload
      };

    default:
      return state;
  }
};

// Initial state
const initialState = {
  items: []
};

// Cart provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('veridax-cart');
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: cartItems });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('veridax-cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('veridax-cart', JSON.stringify(state.items));
  }, [state.items]);

  // Cart actions
  const addItem = (product, quantity = 1) => {
    dispatch({
      type: CART_ACTIONS.ADD_ITEM,
      payload: {
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        quantity,
        sellerId: product.sellerId,
        sellerName: product.sellerId?.name || 'Unknown Seller'
      }
    });
  };

  const removeItem = (productId) => {
    dispatch({
      type: CART_ACTIONS.REMOVE_ITEM,
      payload: productId
    });
  };

  const updateQuantity = (productId, quantity) => {
    dispatch({
      type: CART_ACTIONS.UPDATE_QUANTITY,
      payload: { productId, quantity }
    });
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  };

  // Calculate cart totals
  const getCartTotals = () => {
    const subtotal = state.items.reduce(
      (total, item) => total + (item.price * item.quantity),
      0
    );
    const itemCount = state.items.reduce(
      (total, item) => total + item.quantity,
      0
    );

    return {
      subtotal,
      itemCount,
      shipping: 0, // Will be calculated based on seller
      total: subtotal
    };
  };

  // Check if item is in cart
  const isInCart = (productId) => {
    return state.items.some(item => item.productId === productId);
  };

  // Get item quantity in cart
  const getItemQuantity = (productId) => {
    const item = state.items.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  };

  const value = {
    items: state.items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getCartTotals,
    isInCart,
    getItemQuantity
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
