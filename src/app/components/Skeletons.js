import React from 'react';

// Base skeleton component
const SkeletonBase = ({ className = "", children }) => (
  <div className={`animate-pulse ${className}`}>
    {children}
  </div>
);

// Skeleton for text lines
export const SkeletonText = ({ lines = 1, className = "" }) => (
  <SkeletonBase className={className}>
    {Array.from({ length: lines }).map((_, index) => (
      <div 
        key={index}
        className={`h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 ${
          index === lines - 1 ? 'w-3/4' : 'w-full'
        }`}
      />
    ))}
  </SkeletonBase>
);

// Skeleton for document cards
export const DocumentCardSkeleton = () => (
  <SkeletonBase className="p-4 bg-white/70 dark:bg-blue-900/40 rounded-lg border-2 border-blue-300 dark:border-blue-600">
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center">
        <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded mr-2" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
      </div>
      <div className="flex items-center space-x-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        <div className="h-4 w-9 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    </div>
    
    <div className="flex-grow">
      <div className="flex justify-between items-center mb-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
      </div>
    </div>
    
    <div className="flex justify-end mt-3 space-x-2">
      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
    </div>
  </SkeletonBase>
);

// Skeleton for image gallery items
export const ImageGallerySkeleton = () => (
  <SkeletonBase className="relative bg-white/70 dark:bg-blue-900/40 rounded-lg border-2 border-blue-300 dark:border-blue-600 overflow-hidden">
    <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
    <div className="absolute top-2 right-2 flex space-x-1">
      <div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded-full" />
      <div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded-full" />
      <div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded-full" />
    </div>
    <div className="absolute bottom-2 left-2">
      <div className="h-4 w-9 bg-gray-300 dark:bg-gray-600 rounded-full" />
    </div>
  </SkeletonBase>
);

// Skeleton for stored text items
export const StoredTextSkeleton = () => (
  <SkeletonBase className="p-4 bg-white/70 dark:bg-blue-900/40 rounded-lg border-2 border-blue-300 dark:border-blue-600">
    <div className="flex justify-between items-start">
      <div className="flex-1 mr-4">
        <SkeletonText lines={2} />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mt-2" />
      </div>
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-5 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    </div>
  </SkeletonBase>
);

// Skeleton for the main content areas
export const ContentSkeleton = ({ type = "documents" }) => {
  const getSkeletonItems = () => {
    switch (type) {
      case "documents":
        return Array.from({ length: 4 }).map((_, index) => (
          <DocumentCardSkeleton key={index} />
        ));
      case "gallery":
        return Array.from({ length: 6 }).map((_, index) => (
          <ImageGallerySkeleton key={index} />
        ));
      case "notes":
        return Array.from({ length: 3 }).map((_, index) => (
          <StoredTextSkeleton key={index} />
        ));
      default:
        return null;
    }
  };

  const getGridClass = () => {
    switch (type) {
      case "documents":
        return "grid grid-cols-1 md:grid-cols-2 gap-4";
      case "gallery":
        return "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4";
      case "notes":
        return "space-y-4";
      default:
        return "space-y-4";
    }
  };

  return (
    <div className="w-full bg-white/80 dark:bg-blue-950/70 rounded-2xl shadow-lg p-6 border border-blue-100 dark:border-blue-900">
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-36" />
      </div>
      
      <div className={getGridClass()}>
        {getSkeletonItems()}
      </div>
    </div>
  );
};

// Loading spinner component
export const LoadingSpinner = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`animate-spin ${sizeClasses[size]} border-4 border-[var(--primary-blue)] rounded-full border-t-transparent`}></div>
    </div>
  );
};

// Page loading skeleton
export const PageLoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
    <SkeletonBase>
      {/* Header skeleton */}
      <div className="w-full flex items-center justify-between px-6 py-6 bg-white/70 dark:bg-blue-950/80 backdrop-blur-md shadow-sm border-b border-blue-100 dark:border-blue-900">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
        </div>
      </div>

      {/* Navigation skeleton */}
      <div className="flex justify-center space-x-6 py-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-24" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="max-w-6xl mx-auto px-6 pb-8">
        <ContentSkeleton type="documents" />
      </div>
    </SkeletonBase>
  </div>
);

export default {
  SkeletonText,
  DocumentCardSkeleton,
  ImageGallerySkeleton,
  StoredTextSkeleton,
  ContentSkeleton,
  LoadingSpinner,
  PageLoadingSkeleton
}; 