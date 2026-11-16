import "./globals.css";
import AuthGate from "@/components/AuthGate";
import Tabs from "@/components/Tabs";

export const metadata = {
  title: "Hometown Harvest Hub",
  robots: { index: false, follow: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2f5d3a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthGate>
          <Tabs />
          <main className="container">{children}</main>
        </AuthGate>
      </body>
    </html>
  );
}
