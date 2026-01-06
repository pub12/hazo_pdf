import type { Metadata } from "next";
// Import full styles for standalone test app (includes Tailwind preflight)
// Consumers should use 'hazo_pdf/styles.css' (no preflight) instead
import "../src/styles/full.css";

export const metadata: Metadata = {
  title: "Test App",
  description: "Test application with shadcn sidebar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

