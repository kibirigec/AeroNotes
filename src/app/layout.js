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
                // Ignore system preference - only use stored preference
                function getThemePreference() {
                  if (typeof localStorage !== 'undefined' && localStorage.getItem('theme') === 'dark') {
                    return 'dark';
                  }
                  // Always default to light
                  return 'light';
                }
                
                const theme = getThemePreference();
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-mode', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-mode', 'light');
                  // Ensure light is persisted
                  if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('theme', 'light');
                  }
                }
              })();
            `,
          }}
        />
        {/* Tell the browser we support both schemes and will handle them manually */}
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
