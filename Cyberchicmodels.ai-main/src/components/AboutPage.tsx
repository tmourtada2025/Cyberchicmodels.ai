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
                At CyberChicModels.ai, we're reimagining the world of fashion through the lens of artificial intelligence. 
                Our platform curates a growing library of AI-generated fashion models—each designed with precision, diversity, 
                and visual impact in mind.
              </p>
              <p>
                Whether you're building creative campaigns, AI training models, or branded assets, our digital models are 
                tailored for modern creators who demand style, flexibility, and innovation.
              </p>
            </div>

            <h2 className="text-2xl font-serif mb-8">What We Offer</h2>
            
            <div className="grid gap-6 mb-12">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-serif mb-3">AI-Generated Fashion Models</h3>
                <p className="text-gray-700">
                  Each model is unique and expressive, available in multiple styles, categories, and cultural representations.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-serif mb-3">Download-Ready Packs</h3>
                <p className="text-gray-700">
                  Every model includes a collection of high-resolution editorial images, clean training shots, and optional video clips.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-serif mb-3">Creative Support for AI Training</h3>
                <p className="text-gray-700">
                  Our visual assets are structured and labeled for creators looking to train AI tools like Midjourney, Runway, or Stable Diffusion.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-serif mb-3">Digital Couture & Style Concepts</h3>
                <p className="text-gray-700">
                  Our curated looks are crafted to inspire fashion-forward collections, blending high-end aesthetics with algorithmic precision.
                  <span className="text-sm text-gray-500 ml-2">(Optional add-on)</span>
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-serif mb-6">Why We Exist</h2>
            <div className="mb-12">
              <p className="text-gray-700 mb-6">
                Fashion is evolving. With the rise of digital platforms, AI influencers, and virtual campaigns, the demand 
                for fresh, scalable, and diverse visuals has never been greater. We exist to fill that gap—with style.
              </p>
              <p className="text-gray-700">
                Whether you're a designer, marketer, AI developer, or visionary brand—CyberChicModels.ai is your gateway 
                to the next era of visual storytelling.
              </p>
            </div>

            <h2 className="text-2xl font-serif mb-6">Join the Movement</h2>
            <div className="text-center mb-12">
              <p className="text-gray-700 mb-8">
                We're constantly updating our model library, adding new looks, faces, and collections.
                Follow our journey—and shape the future of fashion with us.
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