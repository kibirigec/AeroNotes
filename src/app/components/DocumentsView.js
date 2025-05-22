"use client";

import { useEffect } from "react";
import Documents from "./Documents"; // Assuming Documents is in the same directory

export default function DocumentsView({
  documents,
  isLoading,
  onAddDocument,
  onDeleteDocument,
  onToggleAutoDelete,
  formatLastEdited
}) {
  // Force component to respect theme
  useEffect(() => {
    const elements = document.querySelectorAll('.force-theme');
    elements.forEach(el => {
      el.style.colorScheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
  }, []);

  return (
    <div className="force-theme">
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