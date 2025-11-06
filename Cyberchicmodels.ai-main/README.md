# CyberChicModels.ai

A curated digital platform offering AI-generated fashion models for editorial, branding, and creative content. Our stylish influencers are ready for download, with consistent visual packs tailored for modern creators.

## 🚀 Features

- **AI-Generated Fashion Models** - Unique and expressive models across multiple styles and cultural representations
- **Download-Ready Packs** - High-resolution editorial images, clean training shots, and optional video clips
- **Creative Support for AI Training** - Structured and labeled assets for AI tools like Midjourney, Runway, or Stable Diffusion
- **Digital Couture & Style Concepts** - Curated looks blending high-end aesthetics with algorithmic precision

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/tmourtada2025/CyberChic.git
cd CyberChic
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your Supabase credentials.

4. Start the development server:
```bash
npm run dev
```

## 🗄️ Database Schema

The application uses Supabase with the following main tables:

- **models** - AI model profiles and metadata
- **model_photos** - Image assets for each model
- **model_collections** - Organized photo collections (Athletic, Editorial, etc.)
- **styles** - Digital fashion styles and concepts
- **hero_slides** - Homepage carousel content

## 🎨 Collections

Our models are organized into themed collections:

- Athletic
- Beauty & Close ups
- Casual & Streetwear
- Cinematic
- Commercial
- Concept & Avant Garde
- Cultural & Traditional
- Editorial & Glam
- Fashion & Jewelry
- Runway

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### Local Build

```bash
npm run build

## 📝 License

This project is proprietary. All rights reserved.

## 🤝 Contributing

This is a private project. For questions or collaboration inquiries, please contact the development team.

---

Built with ❤️ for the future of digital fashion