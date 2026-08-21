import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authorization",
  robots: { index: false, follow: false },
};

export default function ConsentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
