"use client"

import Link from "next/link"
import { Building2, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, Github, ArrowRight } from "lucide-react"
import { useSiteSettings } from "@/lib/site-settings-context"

export function Footer() {
  const currentYear = new Date().getFullYear()
  const site = useSiteSettings()

  return (
    <footer className="relative border-t border-border bg-background/50 backdrop-blur-md">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg">
                {site.site_logo_url ? (
                  <img src={site.site_logo_url} alt={site.site_name} className="h-6 w-6 object-contain" />
                ) : (
                  <Building2 className="h-6 w-6 text-primary-foreground" />
                )}
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">{site.site_name}</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              One platform for operations, people, billing, and reporting — whether you run a school, a business, a trust, or an NGO.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a 
                href="#" 
                className="p-2 rounded-lg bg-muted hover:bg-primary/20 hover:text-primary transition-all"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg bg-muted hover:bg-primary/20 hover:text-primary transition-all"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg bg-muted hover:bg-primary/20 hover:text-primary transition-all"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg bg-muted hover:bg-primary/20 hover:text-primary transition-all"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg bg-muted hover:bg-primary/20 hover:text-primary transition-all"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2 group">
                  <span>Features</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2 group">
                  <span>Pricing</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2 group">
                  <span>Integrations</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2 group">
                  <span>Updates</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2 group">
                  <span>Roadmap</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2 group">
                  <span>About Us</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2 group">
                  <span>Blog</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2 group">
                  <span>Careers</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2 group">
                  <span>Partners</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2 group">
                  <span>Contact</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <a href={`mailto:${site.support_email || "support@codeat.in"}`}
                className="text-muted-foreground hover:text-primary transition-colors text-sm">
                {site.support_email || "support@codeat.in"}
              </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <a 
                  href="tel:+1234567890" 
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  +1 (234) 567-890
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground text-sm">
                  123 Education Street<br />
                  Learning City, LC 12345
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            {site.site_footer_text || `© ${currentYear} ${site.site_name}. All rights reserved.`}
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Terms of Service
            </Link>
            <Link 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

