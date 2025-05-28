"use client";

const NavButton = ({ isActive, onClick, SvgIcon, label, hasNewContent }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-3 rounded-xl flex items-center font-semibold shadow transition relative ${
      hasNewContent 
        ? "bg-blue-200 dark:bg-[#1a2655] border-2 border-emerald-500 text-blue-800 dark:text-blue-200 animate-pulse"
        : isActive 
          ? "bg-blue-200 dark:bg-[#1a2655] border border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200" 
          : "bg-blue-100 dark:bg-[#152047] border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-[#1a2655] hover:border-blue-400 dark:hover:border-blue-600"
    }`}
  >
    <SvgIcon />
    {label}
  </button>
);

const MobileNavButton = ({ isActive, onClick, label, hasNewContent }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-xl font-semibold text-sm shadow transition relative ${
      hasNewContent 
        ? "bg-blue-200 dark:bg-[#1a2655] border-2 border-emerald-500 text-blue-800 dark:text-blue-200 animate-pulse"
        : isActive 
          ? "bg-blue-200 dark:bg-[#1a2655] border border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200" 
          : "bg-blue-100 dark:bg-[#152047] border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-[#1a2655] hover:border-blue-400 dark:hover:border-blue-600"
    }`}
  >
    {label}
  </button>
);

// SVG Icon Components (can be inlined or imported from separate files if preferred)
const NotesIcon = () => <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>;
const GalleryIcon = () => <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;
const DocumentsIcon = () => <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>;

export default function NavigationTabs({ activeSection, onSetSection, newContentBadges = {} }) {
  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex justify-center space-x-4 lg:space-x-6 py-4 lg:py-6">
        <NavButton 
          isActive={activeSection === "notes"}
          onClick={() => onSetSection("notes")}
          SvgIcon={NotesIcon}
          label="Notes"
          hasNewContent={newContentBadges.notes || false}
        />
        <NavButton 
          isActive={activeSection === "gallery"}
          onClick={() => onSetSection("gallery")}
          SvgIcon={GalleryIcon}
          label="Gallery"
          hasNewContent={newContentBadges.gallery || false}
        />
        <NavButton 
          isActive={activeSection === "documents"}
          onClick={() => onSetSection("documents")}
          SvgIcon={DocumentsIcon}
          label="Documents"
          hasNewContent={newContentBadges.documents || false}
        />
      </nav>
      {/* Mobile Navigation */}
      <div className="md:hidden flex justify-center border border-slate-200 dark:border-blue-900 bg-slate-50/80 dark:bg-blue-950/80 rounded-xl mb-4 overflow-x-hidden">
        <div className="flex space-x-2 p-3 max-w-full">
          <MobileNavButton 
            isActive={activeSection === "notes"}
            onClick={() => onSetSection("notes")}
            label="Notes"
            hasNewContent={newContentBadges.notes || false}
          />
          <MobileNavButton 
            isActive={activeSection === "gallery"}
            onClick={() => onSetSection("gallery")}
            label="Gallery"
            hasNewContent={newContentBadges.gallery || false}
          />
          <MobileNavButton 
            isActive={activeSection === "documents"}
            onClick={() => onSetSection("documents")}
            label="Docs"
            hasNewContent={newContentBadges.documents || false}
          />
        </div>
      </div>
    </>
  );
} 