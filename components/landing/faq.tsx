"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "Is there a free trial available?",
    answer: "Yes, you can start with our Starter plan which is completely free forever for up to 5 clients. No credit card required."
  },
  {
    question: "Can I change plans later?",
    answer: "Absolutely. You can upgrade or downgrade your plan at any time from your dashboard. Changes take effect immediately."
  },
  {
    question: "What payment methods do you support?",
    answer: "We support all major credit cards, PayPal, and bank transfers. For Enterprise clients, we also support invoicing."
  },
  {
    question: "Is my data secure?",
    answer: "Security is our top priority. We use bank-grade 256-bit encryption, perform regular security audits, and are SOC2 compliant."
  },
  {
    question: "Do you support multiple currencies?",
    answer: "Yes, Invixy supports over 135 currencies. Exchange rates are updated daily to ensure accurate conversions."
  }
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Have a question? We're here to help.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="border rounded-lg overflow-hidden bg-card"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex items-center justify-between w-full p-6 text-left"
              >
                <span className="font-semibold text-lg">{faq.question}</span>
                {openIndex === index ? (
                  <Minus className="w-5 h-5 text-primary flex-shrink-0" />
                ) : (
                  <Plus className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
