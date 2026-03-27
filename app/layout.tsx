import type { Metadata } from "next"
import { Inter, Roboto, Poppins, Open_Sans, Lato, Montserrat, Playfair_Display, Merriweather, Lora, Roboto_Mono, Fira_Code, Source_Code_Pro } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Chatbot } from "@/components/chatbot/chatbot"
import { ThemeSelector } from "@/components/theme-selector"
import { Footer } from "@/components/layouts/footer"
import { prisma } from "@/lib/prisma"
import { SiteSettingsProvider } from "@/lib/site-settings-context"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const roboto = Roboto({ weight: ["300", "400", "500", "700"], subsets: ["latin"], variable: "--font-roboto" })
const poppins = Poppins({ weight: ["300", "400", "500", "600", "700"], subsets: ["latin"], variable: "--font-poppins" })
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans" })
const lato = Lato({ weight: ["300", "400", "700"], subsets: ["latin"], variable: "--font-lato" })
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })
const merriweather = Merriweather({ weight: ["300", "400", "700"], subsets: ["latin"], variable: "--font-merriweather" })
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" })
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-roboto-mono" })
const firaCode = Fira_Code({ subsets: ["latin"], variable: "--font-fira-code" })
const sourceCodePro = Source_Code_Pro({ subsets: ["latin"], variable: "--font-source-code-pro" })

async function getGlobalSettings() {
  try {
    const rows = await prisma.globalSetting.findMany({
      where: { key: { in: ["site_name", "site_tagline", "site_favicon_url"] } },
    })
    const map: Record<string, string> = {}
    for (const r of rows) map[r.key] = r.value
    return map
  } catch {
    return {}
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getGlobalSettings()
  const name = s["site_name"] || "Codeat ERP"
  const description = s["site_tagline"] || "Multi-tenant ERP for schools, companies, trusts, and NGOs"
  const favicon = s["site_favicon_url"] || undefined
  return {
    title: name,
    description,
    icons: favicon ? { icon: favicon, shortcut: favicon } : undefined,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${roboto.variable} ${poppins.variable} ${openSans.variable} ${lato.variable} ${montserrat.variable} ${playfair.variable} ${merriweather.variable} ${lora.variable} ${robotoMono.variable} ${firaCode.variable} ${sourceCodePro.variable} ${inter.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <main className="flex-1">
              <SiteSettingsProvider>
                {children}
              </SiteSettingsProvider>
            </main>
            <Footer />
          </div>
          <Toaster />
          <Chatbot />
          <ThemeSelector />
        </ThemeProvider>
      </body>
    </html>
  )
}
