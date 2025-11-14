import type { Metadata } from "next";
// Import hazo_pdf styles from source (same as what's in the package)
import "../src/styles/index.css";

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

