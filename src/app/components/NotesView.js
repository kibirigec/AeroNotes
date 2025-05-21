"use client";

import TextInput from "./TextInput";
import StoredTexts from "./StoredTexts";

export default function NotesView({ 
  storedTexts, 
  onSaveText, 
  onToggleAutoDelete 
}) {
  return (
    // This is the layout structure from page.js renderContent for notes
    <div className="flex flex-col gap-2 flex-1">
      <div className="flex-1 min-h-[200px] flex flex-col">
        <TextInput onSaveText={onSaveText} />
      </div>
      <div className="flex-1 min-h-[250px] flex flex-col">
        <StoredTexts texts={storedTexts} onToggleAutoDelete={onToggleAutoDelete} />
      </div>
    </div>
  );
} 