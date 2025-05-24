"use client";

import TextInput from "./TextInput";
import StoredTexts from "./StoredTexts";

export default function NotesView({ 
  storedTexts, 
  onSaveText, 
  onToggleAutoDelete, 
  onNoteCreated, 
  onDeleteNote
}) {
  return (
    <div className="flex flex-col gap-4 md:gap-6 flex-1">
      <div className="w-full">
        <TextInput onSaveText={onSaveText} onNoteCreated={onNoteCreated} />
      </div>
      <div className="w-full">
        <StoredTexts texts={storedTexts} onToggleAutoDelete={onToggleAutoDelete} onDeleteNote={onDeleteNote} />
      </div>
    </div>
  );
} 