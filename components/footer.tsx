import { Car } from "lucide-react"

export function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Car className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">SURA Essence</span>
          </div>

          <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="/book" className="hover:text-foreground transition-colors">
              Book a Ride
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              About Us
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </nav>

          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} SURA Essence</p>
        </div>
      </div>
    </footer>
  )
}
