/**
 * Realtime Synchronization Hook
 * Handles real-time updates for files and notes across devices
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import supabase from '../supabase';

export const useRealtimeSync = ({ 
  userId, 
  onFileAdded, 
  onFileUpdated, 
  onFileDeleted,
  onNoteAdded,
  onNoteUpdated,
  onNoteDeleted,
  enabled = true,
  // Add these to help filter DELETE events
  currentNotes = [],
  currentFiles = []
}) => {
  const channelRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeSessionCount, setActiveSessionCount] = useState(1); // Track number of active sessions
  
  // Use refs to store current data to avoid recreating callbacks
  const currentNotesRef = useRef(currentNotes);
  const currentFilesRef = useRef(currentFiles);
  
  // Store callback refs to prevent subscription recreation
  const callbacksRef = useRef({
    onFileAdded,
    onFileUpdated,
    onFileDeleted,
    onNoteAdded,
    onNoteUpdated,
    onNoteDeleted
  });
  
  // Update refs when data changes
  useEffect(() => {
    currentNotesRef.current = currentNotes;
  }, [currentNotes]);
  
  useEffect(() => {
    currentFilesRef.current = currentFiles;
  }, [currentFiles]);
  
  // Update callback refs
  useEffect(() => {
    callbacksRef.current = {
      onFileAdded,
      onFileUpdated,
      onFileDeleted,
      onNoteAdded,
      onNoteUpdated,
      onNoteDeleted
    };
  }, [onFileAdded, onFileUpdated, onFileDeleted, onNoteAdded, onNoteUpdated, onNoteDeleted]);

  // Debug: Log when hook is initialized
  useEffect(() => {
    if (enabled && userId) {
      console.log('🔄 Realtime sync hook initialized for user:', userId);
    }
  }, [enabled, userId]);

  // File event handlers
  const handleFileInsert = useCallback((payload) => {
    console.log('📄 Realtime INSERT event for file:', payload);
    const newFile = payload.new;
    if (newFile.user_id === userId && callbacksRef.current.onFileAdded) {
      callbacksRef.current.onFileAdded(newFile);
    }
  }, [userId]);

  const handleFileUpdate = useCallback((payload) => {
    console.log('📄 Realtime UPDATE event for file:', payload);
    const updatedFile = payload.new;
    if (updatedFile.user_id === userId && callbacksRef.current.onFileUpdated) {
      callbacksRef.current.onFileUpdated(updatedFile, payload.old);
    }
  }, [userId]);

  const handleFileDelete = useCallback((payload) => {
    console.log('🗑️ Realtime DELETE event for file:', payload);
    const deletedFile = payload.old;
    console.log('🔄 File deletion details:', {
      id: deletedFile.id,
      available_fields: Object.keys(deletedFile)
    });
    
    // For DELETE events, we only get the ID. Check if this file belongs to current user
    // by seeing if it exists in our current files array
    const wasOurFile = currentFilesRef.current.some(file => file.id === deletedFile.id);
    
    if (wasOurFile && callbacksRef.current.onFileDeleted) {
      console.log('✅ Triggering file deletion callback for our file');
      // We need to add the missing info for the callback
      const fileInfo = currentFilesRef.current.find(file => file.id === deletedFile.id);
      callbacksRef.current.onFileDeleted(fileInfo || deletedFile);
    } else {
      console.log('❌ File deletion not triggered - not our file or no callback');
    }
  }, []);

  // Note event handlers
  const handleNoteInsert = useCallback((payload) => {
    console.log('📝 Realtime INSERT event for note:', payload);
    const newNote = payload.new;
    if (newNote.user_id === userId && callbacksRef.current.onNoteAdded) {
      callbacksRef.current.onNoteAdded(newNote);
    }
  }, [userId]);

  const handleNoteUpdate = useCallback((payload) => {
    console.log('📝 Realtime UPDATE event for note:', payload);
    const updatedNote = payload.new;
    if (updatedNote.user_id === userId && callbacksRef.current.onNoteUpdated) {
      callbacksRef.current.onNoteUpdated(updatedNote, payload.old);
    }
  }, [userId]);

  const handleNoteDelete = useCallback((payload) => {
    console.log('🗑️ Realtime DELETE event for note:', payload);
    const deletedNote = payload.old;
    console.log('🔄 Note deletion details:', {
      id: deletedNote.id,
      available_fields: Object.keys(deletedNote)
    });
    
    // For DELETE events, we only get the ID. Check if this note belongs to current user
    // by seeing if it exists in our current notes array
    const wasOurNote = currentNotesRef.current.some(note => note.id === deletedNote.id);
    
    if (wasOurNote && callbacksRef.current.onNoteDeleted) {
      console.log('✅ Triggering note deletion callback for our note');
      // We need to add the missing info for the callback
      const noteInfo = currentNotesRef.current.find(note => note.id === deletedNote.id);
      callbacksRef.current.onNoteDeleted(noteInfo || deletedNote);
    } else {
      console.log('❌ Note deletion not triggered - not our note or no callback');
    }
  }, []);

  useEffect(() => {
    if (!enabled || !userId) {
      setIsConnected(false);
      return;
    }

    console.log('🔄 Setting up realtime subscriptions for user:', userId);
    console.log('🔄 Subscription effect triggered - this should only happen once per user session');

    // Create a unique channel for this user's updates
    const channel = supabase.channel(`realtime-sync-${userId}`)
      // Add presence tracking to detect multiple sessions
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const sessionCount = Object.keys(presenceState).length;
        console.log('🔄 Active sessions for user:', sessionCount);
        setActiveSessionCount(sessionCount);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('🔄 Session joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('🔄 Session left:', leftPresences);
      })
      // Files table listeners
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'files',
          filter: `user_id=eq.${userId}`
        },
        handleFileInsert
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'files',
          filter: `user_id=eq.${userId}`
        },
        handleFileUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'files'
          // No filter for DELETE - we'll handle user filtering in the callback
        },
        handleFileDelete
      )
      // Notes table listeners
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${userId}`
        },
        handleNoteInsert
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${userId}`
        },
        handleNoteUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notes'
          // No filter for DELETE - we'll handle user filtering in the callback
        },
        handleNoteDelete
      )
      .subscribe(async (status, error) => {
        console.log('🔄 Realtime subscription status:', status);
        if (error) {
          console.error('🔄 Realtime subscription error:', error);
        }
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime sync active for files and notes');
          setIsConnected(true);
          
          // Track this session's presence
          await channel.track({
            user_id: userId,
            session_id: Math.random().toString(36).substring(7), // Generate unique session ID
            online_at: new Date().toISOString()
          });
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Failed to subscribe to realtime updates');
          setIsConnected(false);
        } else if (status === 'TIMED_OUT') {
          console.warn('⏰ Realtime subscription timed out');
          setIsConnected(false);
        } else if (status === 'CLOSED') {
          console.log('🔌 Realtime subscription closed');
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    // Test the connection after a short delay
    setTimeout(() => {
      console.log('🔄 Testing realtime connection...');
      console.log('Channel state:', channel.state);
      console.log('Supabase realtime connection:', supabase.realtime.isConnected());
    }, 2000);

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log('🔌 Cleaning up realtime channel - subscription effect cleanup');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
    };
  }, [enabled, userId]); // Only depend on enabled and userId - handlers are stable now

  // Method to manually disconnect
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  return {
    disconnect,
    isConnected,
    activeSessionCount
  };
}; 