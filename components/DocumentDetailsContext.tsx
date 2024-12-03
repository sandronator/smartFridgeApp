// components/DocumentDetailsContext.tsx

import React, { createContext, useState } from "react";

export const DocumentDetailsContext = createContext<any>(null);

export const DocumentDetailsProvider = ({ children }) => {
  const [documentDetails, setDocumentDetails] = useState(null);

  return (
    <DocumentDetailsContext.Provider
      value={{ documentDetails, setDocumentDetails }}
    >
      {children}
    </DocumentDetailsContext.Provider>
  );
};
