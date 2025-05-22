import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./styles/animations.css";
import { AuthProvider } from "../../lib/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AeroNotes",
  description: "Your mini Google Drive alternative",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Script to handle dark mode before page renders (flash prevention) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Completely ignore system preference - only use stored preference
                function getThemePreference() {
                  if (typeof localStorage !== 'undefined' && localStorage.getItem('theme') === 'dark') {
                    return 'dark';
                  }
                  // Always default to light mode, completely ignore browser preference
                  return 'light';
                }
                
                const theme = getThemePreference();
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-mode', 'dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-mode', 'light');
                  document.documentElement.style.colorScheme = 'light';
                  // Ensure light is persisted
                  if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('theme', 'light');
                  }
                }
                
                // Add a special class to directly target with CSS
                document.documentElement.classList.add('custom-theme-control');
                
                // Override color-scheme property directly
                document.documentElement.style.forcedColorAdjust = 'none';
                
                // Set a global observer to override any media query changes
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                mediaQuery.addEventListener('change', () => {
                  // When browser/OS changes preference, don't do anything
                  // We only want our toggle to control dark mode
                  // The stored theme takes precedence
                  const storedTheme = localStorage.getItem('theme');
                  if (storedTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                  
                  // Force update all components with the force-theme class
                  const elements = document.querySelectorAll('.force-theme, #text-input-container, #stored-texts-container, #gallery-container, #documents-container');
                  elements.forEach(el => {
                    if (el) {
                      el.style.colorScheme = storedTheme === 'dark' ? 'dark' : 'light';
                    }
                  });
                });
              })();
            `,
          }}
        />
        {/* Force light mode as the default and override browser preferences */}
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#e6f0ff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a2540" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#e6f0ff" />
        <meta name="msapplication-TileColor" content="#e6f0ff" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased force-theme`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
