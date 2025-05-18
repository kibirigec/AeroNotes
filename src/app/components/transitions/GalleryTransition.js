"use client";
import { useState, useRef } from "react";

export default function GalleryTransition({ isExpanded, onToggle, children, className = "" }) {
  // Gallery ref for positioning
  const containerRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle the toggle
  const handleToggle = () => {
    setIsAnimating(true);
    
    // Short delay to allow animation to begin before state change
    setTimeout(() => {
      onToggle();
      
      // Reset animation state after animation completes
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }, 50);
    
    // Prevent body scrolling when expanded
    if (!isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  // Background overlay when expanded
  const Overlay = isExpanded && (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 ${isAnimating ? 'animate-fadeIn' : ''}`}
      onClick={handleToggle}
    ></div>
  );

  // Container with subtle animation
  const Container = (
    <div 
      ref={containerRef}
      className={`bg-white/80 dark:bg-blue-950/70 rounded-2xl shadow-lg p-6 flex flex-col gap-4 border border-blue-100 dark:border-blue-900 ${
        isExpanded ? 'fixed z-50 overflow-auto inset-4 max-w-[1200px] max-h-[calc(100vh-2rem)] mx-auto my-auto' : 'relative w-full'
      } ${isAnimating ? (isExpanded ? 'animate-fadeIn' : 'animate-fadeOut') : ''} ${className}`}
    >
      {children}
    </div>
  );

  return (
    <>
      {Overlay}
      {Container}
    </>
  );
} 