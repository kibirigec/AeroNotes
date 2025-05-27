import { Inter } from "next/font/google";
import "./globals.css";
import "./styles/animations.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AeroNotes",
  description: "Your personal note-taking app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#e6f0ff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a2540" media="(prefers-color-scheme: dark)" />
        <meta name="msapplication-TileColor" content="#e6f0ff" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
