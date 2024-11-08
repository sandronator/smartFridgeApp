import React, { createContext, useReducer, useContext, ReactNode } from 'react';
import 'react-native-get-random-values';  // Import the polyfill
import { v4 as uuidv4 } from 'uuid';  // Now you can safely use uuid

// Define the type for each item
type Item = {
  id: string;  // Use string for UUIDs
  name: string;
};

// Define the action types
type Action =
  | { type: 'ADD_ITEM'; payload: string }
  | { type: 'DELETE_ITEM'; payload: string };

// Define the initial state type
type State = {
  items: Item[];
};

// Initial items
const initialState: State = {
  items: [
    { id: uuidv4(), name: 'Salad' },
    { id: uuidv4(), name: 'Pikantwurst' },
    { id: uuidv4(), name: 'Milch' },
    { id: uuidv4(), name: 'Zitrone' },
    { id: uuidv4(), name: 'Gurken' },
  ],
};

// Reducer function to handle actions
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_ITEM':
      const newItem: Item = {
        id: uuidv4(),
        name: action.payload,
      };
      return { ...state, items: [...state.items, newItem] };
    case 'DELETE_ITEM':
      return { ...state, items: state.items.filter((item) => item.id !== action.payload) };
    default:
      return state;
  }
}

// Create the context for state management
const StateManagementContext = createContext<{ state: State; dispatch: React.Dispatch<Action> } | undefined>(
  undefined
);

// Create a custom hook to use the context
export function useStateManagement() {
  const context = useContext(StateManagementContext);
  if (!context) {
    throw new Error('useStateManagement must be used within a StateManagementProvider');
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
