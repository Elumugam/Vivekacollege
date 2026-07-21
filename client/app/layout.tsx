import type { Metadata } from "next";
import { Merriweather, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";
import PopupPoster from "@/components/PopupPoster";
import EnquiryPopup from "@/components/EnquiryPopup";
import { Toaster } from "react-hot-toast";

const merriweather = Merriweather({
  variable: "--font-serif",
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Viveka College | Distance Education / Study Centre",
  description: "Viveka College offers distance education, undergraduate, postgraduate, diploma and professional programs with academic guidance and career support.",
  openGraph: {
    title: "Viveka College",
    description: "Distance Education / Study Centre",
  },
  twitter: {
    title: "Viveka College",
    description: "Distance Education / Study Centre",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${merriweather.variable} antialiased font-sans bg-cream text-navy`}
      >
        <AnnouncementBar slot="top" />
        <PopupPoster />
        <EnquiryPopup />
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      </body>
    </html>
  );
}
