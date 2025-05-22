"use client";

import { useEffect } from "react";
import TextInput from "./TextInput";
import StoredTexts from "./StoredTexts";

export default function NotesView({ 
  storedTexts, 
  onSaveText, 
  onToggleAutoDelete, 
  onNoteCreated
}) {
  // Force component to respect theme
  useEffect(() => {
    const elements = document.querySelectorAll('.force-theme');
    elements.forEach(el => {
      el.style.colorScheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
  }, []);

  return (
    // This is the layout structure from page.js renderContent for notes
    <div className="flex flex-col gap-2 flex-1 force-theme">
      <div className="flex-1 min-h-[200px] flex flex-col">
        <TextInput onSaveText={onSaveText} onNoteCreated={onNoteCreated} />
      </div>
      <div className="flex-1 min-h-[250px] flex flex-col">
        <StoredTexts texts={storedTexts} onToggleAutoDelete={onToggleAutoDelete} />
      </div>
    </div>
  );
} 