import type { Metadata } from "next";
import localFont from "next/font/local";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "./globals.css";
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import ConvexClerkProvider from "@/components/providers/ConvexClerkProvider";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "react-hot-toast";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function Head() {
  return (
    <>
      <title>Virtual Interview Platform</title>
      <meta name="description" content="Conduct interviews with video calling, screen sharing, and collaborative code editing." />

      {/* Open Graph */}
      <meta property="og:title" content="Virtual Interview Platform" />
      <meta property="og:description" content="Conduct interviews like a pro — collaborate with candidates in real-time." />
      <meta property="og:image" content="https://remote-interview-platform-xi.vercel.app/preview.jpeg" />
      <meta property="og:url" content="https://remote-interview-platform-xi.vercel.app" />
      <meta property="og:type" content="website" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Virtual Interview Platform" />
      <meta name="twitter:description" content="Conduct interviews like a pro — collaborate with candidates in real-time." />
      <meta name="twitter:image" content="https://remote-interview-platform-xi.vercel.app/preview.jpeg" />
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SignedIn>
              <div className="min-h-screen">
                <Navbar />
                <main className="px-4 sm:px-6 lg:px-8">{children}</main>
              </div>
            </SignedIn>

            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </ThemeProvider>
          <Toaster />
        </body>
      </html>
    </ConvexClerkProvider>
  );
}
