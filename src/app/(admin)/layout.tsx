import "../styles/globals.css"

import {Inter} from "next/font/google"

const inter = Inter({subsets: ["latin"]})

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={inter.className}>{children}</div>
}
