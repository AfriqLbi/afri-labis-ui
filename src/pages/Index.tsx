import Header from "./_components/Header.tsx";
import Hero from "./_components/Hero.tsx";
import FeaturedCategories from "./_components/FeaturedCategories.tsx";
import Lookbook from "./_components/Lookbook.tsx";
import BrandStory from "./_components/BrandStory.tsx";
import Newsletter from "./_components/Newsletter.tsx";
import Footer from "./_components/Footer.tsx";
import FeaturedProducts from "./_components/FeaturedProducts.tsx";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <FeaturedCategories />
        <FeaturedProducts />
        <Lookbook />
        <BrandStory />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}
