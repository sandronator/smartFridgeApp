<<<<<<< HEAD
import React, { createContext, useReducer, useContext, ReactNode } from "react";
import "react-native-get-random-values"; // Polyfill for UUIDs
import { v4 as uuidv4 } from "uuid";

// Define the type for each item
type Item = {
  id: string; // UUID
  name: string;
  nutrition: Record<string, any>; // Adjust type as needed
=======
import React, { createContext, useReducer, useContext, ReactNode } from 'react';
import 'react-native-get-random-values';  // Import the polyfill
import { v4 as uuidv4 } from 'uuid';  // Now you can safely use uuid

// Define the type for each item
type Item = {
  id: string;  // Use string for UUIDs
  name: string;
>>>>>>> origin/main
};

// Define the action types
type Action =
<<<<<<< HEAD
  | { type: "ADD_ITEM"; payload: Item }
  | { type: "DELETE_ITEM"; payload: string };
=======
  | { type: 'ADD_ITEM'; payload: string }
  | { type: 'DELETE_ITEM'; payload: string };
>>>>>>> origin/main

// Define the initial state type
type State = {
  items: Item[];
};

<<<<<<< HEAD
// Initial items (optional)
const initialState: State = {
  items: [
    // Existing items without nutrition data
    { id: uuidv4(), name: "Lettuce", nutrition: {} },
    { id: uuidv4(), name: "Fish", nutrition: {} },
    { id: uuidv4(), name: "Milk", nutrition: {} },
    { id: uuidv4(), name: "Onions", nutrition: {} },
    { id: uuidv4(), name: "Corn", nutrition: {} },
=======
// Initial items
const initialState: State = {
  items: [
    { id: uuidv4(), name: 'Salad' },
    { id: uuidv4(), name: 'Pikantwurst' },
    { id: uuidv4(), name: 'Milch' },
    { id: uuidv4(), name: 'Zitrone' },
    { id: uuidv4(), name: 'Gurken' },
>>>>>>> origin/main
  ],
};

// Reducer function to handle actions
function reducer(state: State, action: Action): State {
  switch (action.type) {
<<<<<<< HEAD
    case "ADD_ITEM":
      return { ...state, items: [...state.items, action.payload] };
    case "DELETE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };
=======
    case 'ADD_ITEM':
      const newItem: Item = {
        id: uuidv4(),
        name: action.payload,
      };
      return { ...state, items: [...state.items, newItem] };
    case 'DELETE_ITEM':
      return { ...state, items: state.items.filter((item) => item.id !== action.payload) };
>>>>>>> origin/main
    default:
      return state;
  }
}

// Create the context for state management
<<<<<<< HEAD
const StateManagementContext = createContext<
  | {
      state: State;
      dispatch: React.Dispatch<Action>;
    }
  | undefined
>(undefined);
=======
const StateManagementContext = createContext<{ state: State; dispatch: React.Dispatch<Action> } | undefined>(
  undefined
);
>>>>>>> origin/main

// Create a custom hook to use the context
export function useStateManagement() {
  const context = useContext(StateManagementContext);
  if (!context) {
<<<<<<< HEAD
    throw new Error(
      "useStateManagement must be used within a StateManagementProvider"
    );
=======
    throw new Error('useStateManagement must be used within a StateManagementProvider');
>>>>>>> origin/main
  }
  return context;
}

// Provider component
export function StateManagementProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <StateManagementContext.Provider value={{ state, dispatch }}>
      {children}
    </StateManagementContext.Provider>
  );
}
