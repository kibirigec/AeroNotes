"use client";

import Documents from "./Documents"; // Assuming Documents is in the same directory

export default function DocumentsView({
  documents,
  isLoading,
  onAddDocument,
  onDeleteDocument,
  onToggleAutoDelete,
  formatLastEdited
}) {
  return (
    <Documents 
      documents={documents}
      isLoading={isLoading}
      onAddDocument={onAddDocument}
      onDeleteDocument={onDeleteDocument}
      onToggleAutoDelete={onToggleAutoDelete}
      formatLastEdited={formatLastEdited}
    />
  );
} 