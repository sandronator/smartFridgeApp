import React, { createContext, useReducer, useContext, ReactNode } from "react";
import "react-native-get-random-values"; // Polyfill for UUIDs
import { v4 as uuidv4 } from "uuid";

// Define the type for each item
type Item = {
  id: string; // UUID
  name: string;
  nutrition: Record<string, any>; // Adjust type as needed
};

// Define the action types
type Action =
  | { type: "ADD_ITEM"; payload: Item }
  | { type: "DELETE_ITEM"; payload: string };

// Define the initial state type
type State = {
  items: Item[];
};

// Initial items (optional)
const initialState: State = {
  items: [
    // Existing items without nutrition data
    { id: uuidv4(), name: "Lettuce", nutrition: {} },
    { id: uuidv4(), name: "Fish", nutrition: {} },
    { id: uuidv4(), name: "Milk", nutrition: {} },
    { id: uuidv4(), name: "Onions", nutrition: {} },
    { id: uuidv4(), name: "Corn", nutrition: {} },
  ],
};

// Reducer function to handle actions
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_ITEM":
      return { ...state, items: [...state.items, action.payload] };
    case "DELETE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };
    default:
      return state;
  }
}

// Create the context for state management
const StateManagementContext = createContext<
  | {
      state: State;
      dispatch: React.Dispatch<Action>;
    }
  | undefined
>(undefined);

// Create a custom hook to use the context
export function useStateManagement() {
  const context = useContext(StateManagementContext);
  if (!context) {
    throw new Error(
      "useStateManagement must be used within a StateManagementProvider"
    );
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
