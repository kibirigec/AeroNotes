"use client";

import Documents from "./Documents";

export default function DocumentsView({
  documents,
  isLoading,
  onAddDocument,
  onDeleteDocument,
  onToggleAutoDelete,
  formatLastEdited
}) {
  return (
    <div className="w-full">
      <Documents 
        documents={documents}
        isLoading={isLoading}
        onAddDocument={onAddDocument}
        onDeleteDocument={onDeleteDocument}
        onToggleAutoDelete={onToggleAutoDelete}
        formatLastEdited={formatLastEdited}
      />
    </div>
  );
} 