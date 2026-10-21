import { Inter, Space_Grotesk, Tajawal } from "next/font/google";
import "./globals.css";

export const metadata = {
  title: "Beity — Household Electrical Appliances",
  description: "Minimal catalog for high-performance household appliances.",
  icons: "/logo.png"
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      className={`${inter.variable} ${spaceGrotesk.variable} ${tajawal.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}