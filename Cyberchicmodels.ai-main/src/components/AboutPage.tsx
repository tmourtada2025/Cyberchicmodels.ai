import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Footer } from './Footer';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            <Link to="/" className="flex items-center text-gray-600 hover:text-black">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
          </div>
          <h1 className="text-4xl font-serif mb-12 text-center">About CyberChicModels.ai</h1>
          <div className="prose prose-lg mx-auto">
            <div className="text-lg text-gray-700 mb-12">
              <p className="mb-6">
                CyberChicModels.ai is a licensable AI model agency. Not a stock library — a curated roster of persistent digital identities built for brand campaigns, editorial production, and creative content at scale.
              </p>
              <p>
                Each model on our roster is a unique AI identity with a defined look, cultural background, and commercial range. License the face. Deploy it across every campaign, platform, and format you need.
              </p>
            </div>
            <h2 className="text-2xl font-serif mb-8">What We Offer</h2>
            <div className="grid gap-6 mb-12">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-serif mb-3">AI-Generated Fashion Models</h3>
                <p className="text-gray-700">
                  Each model is a unique, persistent AI identity - expressive, consistent, and available across multiple styles, categories, and cultural representations.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-serif mb-3">Licensable Model Identities</h3>
                <p className="text-gray-700">
                  Our models are available for commercial licensing across editorial campaigns, brand activations, social media, and creative productions. Each identity is built to be deployed at scale.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-serif mb-3">Brand Collaboration</h3>
                <p className="text-gray-700">
                  Partner with our virtual talent for product campaigns, seasonal lookbooks, and digital storytelling. Our models adapt seamlessly to brand guidelines and creative briefs.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-serif mb-3">Ethical & Scalable</h3>
                <p className="text-gray-700">
                  No shoots, no contracts, no scheduling. Our models are available on demand — consistent, ethical, and built to scale with your creative output.
                </p>
              </div>
            </div>
            <h2 className="text-2xl font-serif mb-6">Why We Exist</h2>
            <div className="mb-12">
              <p className="text-gray-700 mb-6">
                Fashion is evolving. With the rise of digital platforms, AI influencers, and virtual campaigns, the demand for fresh, scalable, and diverse visuals has never been greater. We exist to fill that gap - with style.
              </p>
              <p className="text-gray-700">
                Whether you're a designer, marketer, or visionary brand - CyberChicModels.ai is your gateway to the next era of visual storytelling.
              </p>
            </div>
            <h2 className="text-2xl font-serif mb-6">Join the Movement</h2>
            <div className="text-center mb-12">
              <p className="text-gray-700 mb-8">
                We're constantly expanding our model roster, adding new faces, identities, and collections. Follow our journey - and shape the future of fashion with us.
              </p>
              <Link
                to="/models"
                className="inline-block bg-black text-white px-8 py-3 rounded-full hover:bg-opacity-90 transition"
              >
                Explore Our Models
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}