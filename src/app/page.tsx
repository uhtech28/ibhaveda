import HeroSection from "@/components/hero-section";
import FAQsTwo from "@/components/faqs-2";
import WallOfLoveSection from "@/components/testimonials";
import FooterSection from "@/components/footer";

export default function Home() {
  return (
    <div className="max-w-[720px] mx-auto px-4">
      <HeroSection />
      <FAQsTwo />
      <div className="max-w-4xl mx-auto">
        <WallOfLoveSection />
      </div>
      <FooterSection />
    </div>
  );
}
