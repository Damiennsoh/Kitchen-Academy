import Link from "next/link";
import { ChefHat, Users, Award, BookOpen, ArrowRight, Star, Play } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-chef-dark via-chef-dark to-brand-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556910103-1c02745a30bf?w=1200')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span>472K+ followers • 7,000+ students trained</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Master the Art of{" "}
              <span className="text-brand-400">Zimbabwean Cooking</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl">
              Join live masterclasses with Chipo, earn certificates, download recipe PDFs, 
              and become the cook your family brags about.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/classes"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors text-lg"
              >
                Browse Classes
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-lg"
              >
                <Play className="w-5 h-5" />
                Join Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-brand-600">472K+</div>
              <div className="text-sm text-gray-500 mt-1">Facebook Followers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-600">7,000+</div>
              <div className="text-sm text-gray-500 mt-1">Students Trained</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-600">50+</div>
              <div className="text-sm text-gray-500 mt-1">Classes Hosted</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-600">$5</div>
              <div className="text-sm text-gray-500 mt-1">Starting Price</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From registration to certificate — your journey to becoming a better cook starts here.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: BookOpen, title: "Pick a Class", desc: "Browse upcoming live masterclasses or pre-recorded courses." },
              { icon: Users, title: "Register & Pay", desc: "Sign up with your name and phone. Pay with EcoCash or card." },
              { icon: Play, title: "Cook Live", desc: "Join the live stream, cook alongside Chipo, ask questions." },
              { icon: Award, title: "Earn Certificate", desc: "Get your branded certificate and share your achievement." },
            ].map((step, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mb-4">
                  <step.icon className="w-6 h-6 text-brand-600" />
                </div>
                <div className="text-sm font-semibold text-brand-600 mb-2">Step {i + 1}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Classes Preview */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Upcoming Classes</h2>
              <p className="text-gray-600">Book your spot before they fill up!</p>
            </div>
            <Link href="/classes" className="inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700">
              View All Classes <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Grilled Chicken Masterclass", price: "$5", date: "Aug 15, 6:00 PM", spots: "12 spots left", image: "🍗" },
              { title: "Traditional Sadza & Relish", price: "$5", date: "Aug 22, 5:00 PM", spots: "8 spots left", image: "🍲" },
              { title: "Home Bread Baking", price: "$10", date: "Aug 29, 4:00 PM", spots: "20 spots left", image: "🍞" },
            ].map((cls, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
                <div className="h-40 bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-6xl">
                  {cls.image}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-brand-600">{cls.date}</span>
                    <span className="text-lg font-bold text-gray-900">{cls.price}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors">{cls.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">{cls.spots}</p>
                  <Link
                    href="/classes"
                    className="block w-full text-center py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    Register Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-brand-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Cook Like Chipo?
          </h2>
          <p className="text-brand-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of Zimbabwean home cooks who are already transforming their kitchens. 
            Your first certificate is waiting.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-600 font-bold rounded-xl hover:bg-gray-100 transition-colors text-lg"
          >
            <ChefHat className="w-5 h-5" />
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}
