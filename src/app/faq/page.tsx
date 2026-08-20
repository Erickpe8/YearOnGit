import type { Metadata } from "next";
import { FaqPage } from "@/components/info/faq-page";
import { JsonLd } from "@/components/seo/json-ld";
import { LANDING_FAQ, buildPageMetadata } from "@/lib/seo/pages";

export const metadata: Metadata = buildPageMetadata("faq");

export default function FaqRoute() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: LANDING_FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <JsonLd data={faqLd} />
      <FaqPage />
    </>
  );
}
