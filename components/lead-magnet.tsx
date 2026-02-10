"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, CheckCircle } from "lucide-react"

export function LeadMagnet() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-primary text-primary-foreground overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">Free: 7-Step Travel Checklist</h3>
                <p className="text-primary-foreground/80 mb-6">
                  Planning a trip to Rwanda? Download our essential checklist to make your journey smooth from landing
                  to exploring.
                </p>
                <ul className="space-y-2 mb-6">
                  {["Visa requirements", "Currency tips", "Must-visit spots", "Local etiquette"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button variant="secondary" size="lg" className="w-full md:w-auto" asChild>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      alert("Download link placeholder - connect your PDF here!")
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Free Checklist
                  </a>
                </Button>
              </div>
              <div className="hidden md:block w-48 h-48 bg-primary-foreground/10 rounded-2xl flex items-center justify-center">
                <Download className="w-20 h-20 text-primary-foreground/30" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
