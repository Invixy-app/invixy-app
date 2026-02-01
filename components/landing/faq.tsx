"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "What plans does Invixy offer?",
    answer:
      "Invixy offers a Free Starter plan for basic invoicing needs and a Pro plan for advanced features such as automated reminders, recurring invoices, and multi-currency support. Enterprise options are available soon for large organizations.",
  },
  {
    question: "Is there a free plan or trial?",
    answer:
      "Yes! The Starter plan is free forever for up to 5 active clients with essential invoicing features. No credit card is required to start.",
  },
  {
    question: "Can I switch plans later?",
    answer:
      "Absolutely — you can upgrade or downgrade your plan at any time from your dashboard. Changes take effect immediately and your billing will adjust accordingly.",
  },
  {
    question: "How does billing work?",
    answer:
      "Invixy supports monthly, quarterly, and yearly billing. Quarterly bills receive a 10% discount and yearly bills receive a 17% discount off the monthly rate.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Security is one of our top priorities. We use industry-standard encryption for data in transit and at rest, regular vulnerability scans, and strong access controls to keep your information safe.",
  },
  {
    question: "Does Invixy support GST and e-invoicing?",
    answer:
      "Yes — Invixy supports GST-compliant invoicing and helps you generate valid tax invoices. For e-invoicing where applicable, you can export or integrate with the required portals (confirm current applicability for your business).",
  },
  {
    question: "How are backups and data retention handled?",
    answer:
      "We regularly back up your data and retain records per compliance requirements. However, you are encouraged to export and back up your own invoice records to meet your internal needs.",
  },
  {
    question: "What payment methods are supported?",
    answer:
      "We integrate with major payment gateways for card and online payments. Gateway support may vary by region, and taxes such as GST may be applied where required.",
  },
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
            Common questions about Invixy’s plans, billing, security, and more.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border rounded-lg overflow-hidden bg-card"
            >
              <button
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
                className="flex items-center justify-between w-full p-6 text-left"
              >
                <span className="font-semibold text-lg">
                  {faq.question}
                </span>
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
