import HeroSection from "@/components/hero-section";
import RoleSelector from "@/components/role-selector";
import FooterSection from "@/components/footer";
import LandingTopBar from "@/components/landing-top-bar";
import LandingIntro from "@/components/landing-intro";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      {/* First-visit cinematic intro overlay (auto-plays once per browser). */}
      <LandingIntro />

      {/* Desktop-only "Already a user? Login" bar pinned to top. */}
      <LandingTopBar />

      <div className="max-w-[1100px] mx-auto px-4">
        <HeroSection />
        <RoleSelector />
      </div>

      <div className="max-w-[720px] mx-auto px-4">
        <FooterSection />
      </div>
    </div>
  );
}
