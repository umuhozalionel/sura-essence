import { MousePointerClick, MessageSquare, CarFront } from "lucide-react";

export function HowItWorks() {
  const steps = [
    { icon: MousePointerClick, title: "1. Choose Your Ride", desc: "Select your route and vehicle class." },
    { icon: MessageSquare, title: "2. Confirm Details", desc: "We confirm availability instantly via WhatsApp or Email." },
    { icon: CarFront, title: "3. Enjoy the Ride", desc: "Your driver arrives 15 minutes early. Payment happens after." }
  ];

  return (
    <section className="py-20 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 text-center">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center group">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                <step.icon size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-gray-500 max-w-xs">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
