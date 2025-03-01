import Features from "@/components/Features";
import HeroLanding from "@/components/HeroLanding";
import { Navbar } from "@/components/Navbar";
import Redirect from "@/components/Redirect";

export default function Home() {
  return (
    <main>
      <Redirect/>
      <HeroLanding />
      <Features/>
    </main>
  );
}
