"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const fadeIn = (delay = 0) => ({
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { delay, duration: 0.6, ease: "easeOut" } },
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-900">
      {/* Navbar */}
      <header className="border-b bg-white/70 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-3xl font-extrabold text-indigo-600 tracking-tight">Invixy</h1>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all">
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex items-center justify-center py-20">
        <section className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto px-6 sm:px-8">
          {/* Text */}
          <motion.div
            variants={fadeIn(0.1)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="space-y-6 text-center lg:text-left"
          >
            <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight">
              Simplify Your{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
                Invoicing Workflow
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0">
              Automate invoices, manage taxes, and track payments effortlessly —
              all from a single intelligent dashboard.
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mt-8">
              <Button
                size="lg"
                asChild
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg shadow-md"
              >
                <Link href="/auth/signup" className="flex items-center space-x-2">
                  <span>Start Free Trial</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="px-8 py-6 text-lg border-indigo-600 text-indigo-600 hover:bg-indigo-50"
              >
                <Link href="/learn-more">See How It Works</Link>
              </Button>
            </div>
          </motion.div>

          {/* Hero Illustration */}
          <motion.div
            variants={fadeIn(0.3)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-blue-50 rounded-3xl blur-3xl opacity-70 group-hover:opacity-90 transition-all"></div>
            <img
              src="https://cdn.dribbble.com/users/1162077/screenshots/15694429/media/09a2b7f6c4821b44215f16cf67924b7c.png?compress=1&resize=1200x900"
              alt="Dashboard Preview"
              className="relative rounded-2xl shadow-xl border border-gray-200 transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </motion.div>
        </section>
      </main>

      {/* Trusted By Section */}
      <motion.section
        variants={fadeIn(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="py-12 bg-white border-y"
      >
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gray-500 mb-6 uppercase tracking-wider text-sm">
            Trusted by businesses worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-80">
            {[
              "https://cdn-icons-png.flaticon.com/512/5968/5968705.png",
              "https://cdn-icons-png.flaticon.com/512/732/732221.png",
              "https://cdn-icons-png.flaticon.com/512/732/732223.png",
              "https://cdn-icons-png.flaticon.com/512/732/732212.png",
              "https://cdn-icons-png.flaticon.com/512/5968/5968700.png",
            ].map((logo, i) => (
              <img key={i} src={logo} alt="brand" className="h-10 grayscale hover:grayscale-0 transition" />
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <motion.section
        variants={fadeIn(0.2)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="bg-white py-24"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <h2 className="text-4xl font-bold text-center mb-14">
            Everything You Need — All In One Place
          </h2>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "📊", title: "Analytics Dashboard", desc: "Visualize revenue and payment trends." },
              { icon: "🌍", title: "Multi-Country Tax", desc: "Handle GST, VAT, and regional tax laws easily." },
              { icon: "🔔", title: "Smart Reminders", desc: "Never miss a due date again." },
              { icon: "⚡", title: "Quick Invoice Generation", desc: "Create invoices in seconds." },
              { icon: "🔒", title: "Secure Cloud Storage", desc: "Bank-level data protection." },
              { icon: "🤝", title: "Team Collaboration", desc: "Add members and assign permissions." },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                variants={fadeIn(0.1 + idx * 0.1)}
                className="p-8 bg-gradient-to-br from-white to-indigo-50 rounded-2xl shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section
        variants={fadeIn(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="py-24 bg-gradient-to-br from-indigo-50 to-blue-50"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-4xl font-bold mb-14">What Our Users Say</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                name: "Aarav Mehta",
                company: "Fintrack Pvt Ltd",
                quote:
                  "Invixy has completely streamlined our billing system. The automation features save us hours every week.",
              },
              {
                name: "Sophia Lee",
                company: "GlobalLedger",
                quote:
                  "Managing multiple tax systems used to be chaos. Invixy made it effortless and accurate.",
              },
              {
                name: "Rajesh Patel",
                company: "BrightBooks India",
                quote:
                  "Beautiful interface, powerful analytics — it’s everything our finance team needed in one tool.",
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                variants={fadeIn(0.1 + i * 0.1)}
                className="bg-white p-8 rounded-2xl shadow hover:shadow-lg transition"
              >
                <p className="text-gray-700 italic mb-6">“{t.quote}”</p>
                <h4 className="font-semibold text-indigo-600">{t.name}</h4>
                <p className="text-sm text-gray-500">{t.company}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Pricing Preview */}
      <motion.section
        variants={fadeIn(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="py-24 bg-white"
      >
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Simple, Transparent Pricing</h2>
          <p className="text-gray-600 mb-12">Choose a plan that fits your business needs.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Starter",
                price: "₹0",
                features: ["Up to 50 invoices", "Basic analytics", "Email support"],
                highlight: false,
              },
              {
                title: "Pro",
                price: "₹999/mo",
                features: ["Unlimited invoices", "Multi-country tax", "Priority support"],
                highlight: true,
              },
              {
                title: "Enterprise",
                price: "Custom",
                features: ["Dedicated manager", "Custom API access", "Onboarding support"],
                highlight: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={i}
                variants={fadeIn(0.1 + i * 0.1)}
                className={`rounded-2xl p-8 shadow-md hover:shadow-xl transition ${
                  plan.highlight
                    ? "bg-gradient-to-br from-indigo-600 to-blue-500 text-white scale-[1.03]"
                    : "bg-gray-50"
                }`}
              >
                <h3 className="text-2xl font-semibold mb-4">{plan.title}</h3>
                <p className="text-4xl font-bold mb-6">{plan.price}</p>
                <ul className="space-y-3 mb-8 text-sm">
                  {plan.features.map((f, idx) => (
                    <li key={idx}>{f}</li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={plan.highlight ? "secondary" : "outline"}
                  className={`w-full ${plan.highlight ? "bg-white text-indigo-600 hover:bg-indigo-50" : ""}`}
                >
                  <Link href="/auth/signup">Get Started</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Final CTA */}
      <motion.section
        variants={fadeIn(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="py-20 bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-center"
      >
        <h2 className="text-4xl font-bold mb-4">Ready to Simplify Your Billing?</h2>
        <p className="text-lg mb-8 opacity-90">
          Join hundreds of businesses already growing with Invixy.
        </p>
        <Button
          size="lg"
          asChild
          className="bg-white text-indigo-600 hover:bg-indigo-50 px-10 py-6 text-lg font-semibold"
        >
          <Link href="/auth/signup">Start Free Trial</Link>
        </Button>
      </motion.section>

      {/* Footer */}
      <footer className="border-t bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-6 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} Invixy. All rights reserved.</p>
          <div className="space-x-4 mt-2 sm:mt-0">
            <Link href="/privacy" className="hover:text-indigo-600">Privacy</Link>
            <Link href="/terms" className="hover:text-indigo-600">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
