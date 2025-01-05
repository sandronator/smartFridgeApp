import React, { createContext, useState } from "react";

export const DocumentDetailsContext = createContext<any>(null);

export const DocumentDetailsProvider = ({ children }) => {
  let [documentDetails, setDocumentDetails] = useState(null);

  const updateDocumentDetails = (newDetails) => {
    setDocumentDetails(null);
    setDocumentDetails(newDetails);
  };

  return (
    <DocumentDetailsContext.Provider
      value={{
        documentDetails,
        updateDocumentDetails: updateDocumentDetails,
      }}
    >
      {children}
    </DocumentDetailsContext.Provider>
  );
};
