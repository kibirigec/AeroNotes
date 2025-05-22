"use client";

const NavButton = ({ isActive, onClick, SvgIcon, label }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-3 rounded-lg flex items-center font-medium transition ${isActive ? "bg-white dark:bg-blue-900/30 text-blue-600 dark:text-blue-100 shadow-md border border-slate-200 dark:border-blue-800" : "hover:bg-slate-100 dark:hover:bg-blue-900/20 text-slate-600 dark:text-blue-200 hover:shadow-sm"}`}
  >
    <SvgIcon />
    {label}
  </button>
);

const MobileNavButton = ({ isActive, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-lg font-medium text-sm ${isActive ? "bg-white dark:bg-blue-800/50 text-blue-600 dark:text-blue-100 shadow-sm border border-slate-200 dark:border-blue-700" : "hover:bg-slate-100 dark:hover:bg-blue-900/30 text-slate-500 dark:text-blue-200"}`}
  >
    {label}
  </button>
);

// SVG Icon Components (can be inlined or imported from separate files if preferred)
const NotesIcon = () => <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>;
const GalleryIcon = () => <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;
const DocumentsIcon = () => <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>;

export default function NavigationTabs({ activeSection, onSetSection }) {
  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex justify-center space-x-6 py-6">
        <NavButton 
          isActive={activeSection === "notes"}
          onClick={() => onSetSection("notes")}
          SvgIcon={NotesIcon}
          label="Notes"
        />
        <NavButton 
          isActive={activeSection === "gallery"}
          onClick={() => onSetSection("gallery")}
          SvgIcon={GalleryIcon}
          label="Gallery"
        />
        <NavButton 
          isActive={activeSection === "documents"}
          onClick={() => onSetSection("documents")}
          SvgIcon={DocumentsIcon}
          label="Documents"
        />
      </nav>
      {/* Mobile Navigation */}
      <div className="lg:hidden flex justify-center border-b border-slate-200 dark:border-blue-900 bg-slate-50/80 dark:bg-blue-950/80">
        <div className="flex space-x-2 p-2">
          <MobileNavButton 
            isActive={activeSection === "notes"}
            onClick={() => onSetSection("notes")}
            label="Notes"
          />
          <MobileNavButton 
            isActive={activeSection === "gallery"}
            onClick={() => onSetSection("gallery")}
            label="Gallery"
          />
          <MobileNavButton 
            isActive={activeSection === "documents"}
            onClick={() => onSetSection("documents")}
            label="Docs"
          />
        </div>
      </div>
    </>
  );
} 