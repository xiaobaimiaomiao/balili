import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import SakuraCursor from "@/components/SakuraCursor";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <SakuraCursor />
      </body>
    </html>
  );
}
