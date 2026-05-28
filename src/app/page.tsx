import HeroSection from "@/components/hero-section";
import FooterSection from "@/components/footer";
import LandingIntro from "@/components/landing-intro";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#070A0F]">
      {/* First-visit cinematic intro overlay */}
      <LandingIntro />

      {/* Hero + role cards — everything above the fold */}
      <HeroSection />

      <div className="max-w-[720px] mx-auto px-4">
        <FooterSection />
      </div>
    </div>
  );
}
