import { useState, useEffect, useCallback } from 'react';
import {
  fetchNotes as fetchNotesService,
  createNote as saveNoteToDbService,
  toggleNoteAutoDelete as toggleNoteAutoDeleteDbService,
} from '../notesService'; // Adjust path as needed

export function useNotes(user) {
  const [storedTexts, setStoredTexts] = useState([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);

  const loadNotes = useCallback(async () => {
    if (!user) {
      setIsLoadingNotes(false);
      setStoredTexts([]); // Clear notes if no user
      return;
    }
    setIsLoadingNotes(true);
    try {
      const notesData = await fetchNotesService();
      setStoredTexts(notesData.map(n => ({
        id: n.id,
        user_id: n.user_id,
        text: n.text,
        autoDelete: n.autoDelete,
        created_at: n.created_at,
        createdAt: new Date(n.created_at).getTime(),
        expiry_date: n.expiry_date,
      })));
    } catch (error) {
      console.error("Error fetching notes in useNotes:", error);
      setStoredTexts([]); // Set to empty on error
    } finally {
      setIsLoadingNotes(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]); // loadNotes dependency includes user

  const handleSaveText = useCallback(async (text) => {
    if (!user) throw new Error("User must be logged in to save a note");
    try {
      // The service function createNote already defaults autoDelete to true and sets expiry
      const newNoteFromDb = await saveNoteToDbService(text);
      const newNoteForState = {
        id: newNoteFromDb.id,
        user_id: newNoteFromDb.user_id,
        text: newNoteFromDb.text,
        autoDelete: newNoteFromDb.autoDelete,
        created_at: newNoteFromDb.created_at,
        createdAt: new Date(newNoteFromDb.created_at).getTime(),
        expiry_date: newNoteFromDb.expiry_date,
      };
      setStoredTexts(prevTexts => [newNoteForState, ...prevTexts]);
      return newNoteForState; // Return the new note for any immediate UI updates if needed
    } catch (error) {
      console.error("Error saving note in useNotes:", error);
      throw error; // Re-throw for the component to handle if necessary
    }
  }, [user]);

  const handleToggleAutoDelete = useCallback(async (noteId) => {
    const noteIndex = storedTexts.findIndex(n => n.id === noteId);
    if (noteIndex === -1) return;
    const originalNote = storedTexts[noteIndex];
    const newAutoDeleteState = !originalNote.autoDelete;

    // Optimistic update
    const optimisticNote = {
      ...originalNote,
      autoDelete: newAutoDeleteState,
      expiry_date: newAutoDeleteState ? originalNote.expiry_date : null, // Keep existing if turning on, null if off
    };
    setStoredTexts(prev => prev.map(n => (n.id === noteId ? optimisticNote : n)));

    try {
      const updatedNoteFromDb = await toggleNoteAutoDeleteDbService(noteId, newAutoDeleteState);
      const formattedNoteForState = {
        id: updatedNoteFromDb.id,
        user_id: updatedNoteFromDb.user_id,
        text: updatedNoteFromDb.text,
        autoDelete: updatedNoteFromDb.autoDelete,
        created_at: updatedNoteFromDb.created_at,
        createdAt: new Date(updatedNoteFromDb.created_at).getTime(),
        expiry_date: updatedNoteFromDb.expiry_date,
      };
      setStoredTexts(prev => prev.map(n => (n.id === noteId ? formattedNoteForState : n)));
    } catch (error) {
      console.error("Error toggling note auto-delete in useNotes:", error);
      setStoredTexts(prev => prev.map(n => (n.id === noteId ? originalNote : n))); // Revert
    }
  }, [storedTexts]); // Added storedTexts to dependency array for originalNote access

  return {
    storedTexts,
    isLoadingNotes,
    saveNoteHandler: handleSaveText,
    toggleNoteAutoDeleteHandler: handleToggleAutoDelete,
    reloadNotes: loadNotes // Expose a reload function
  };
} 