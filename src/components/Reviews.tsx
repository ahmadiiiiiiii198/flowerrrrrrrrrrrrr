
import React, { useState, useEffect } from "react";
import { Star, Quote, User } from "lucide-react";
import PatternDivider from "./PatternDivider";

interface Review {
  id: string;
  author: string;
  rating: number;
  content: string;
  date: string;
  source: "site" | "google";
  avatar?: string;
}

const initialReviews: Review[] = [
  {
    id: "rev1",
    author: "Maria Rossi",
    rating: 5,
    content: "Fiori bellissimi e servizio eccellente! Le composizioni per il mio matrimonio erano perfette, proprio come avevo sognato.",
    date: "2023-12-15",
    source: "google",
    avatar: "https://i.pravatar.cc/150?img=3"
  },
  {
    id: "rev2",
    author: "Giuseppe Bianchi",
    rating: 5,
    content: "Professionalità e qualità incredibili! Francesco ha creato un bouquet stupendo per l'anniversario di mia moglie.",
    date: "2024-01-22",
    source: "google",
    avatar: "https://i.pravatar.cc/150?img=5"
  },
  {
    id: "rev3",
    author: "Mikhail Petrov",
    rating: 4,
    content: "Very authentic Uzbek cuisine. The ambiance transports you to Central Asia and the flavors are bold and delicious.",
    date: "2024-02-10",
    source: "site",
    avatar: "https://i.pravatar.cc/150?img=8"
  },
  {
    id: "rev4",
    author: "Emily Wong",
    rating: 5,
    content: "Came here for a special occasion and was blown away. The Saffron Rice Pudding is to die for! Will definitely be back.",
    date: "2024-03-05",
    source: "site",
    avatar: "https://i.pravatar.cc/150?img=9"
  }
];

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star 
          key={star} 
          size={16} 
          className={star <= rating ? "text-persian-gold fill-persian-gold" : "text-gray-300"} 
        />
      ))}
    </div>
  );
};

const ReviewCard = ({ review }: { review: Review }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-persian-gold/10 hover-scale">
      <div className="flex justify-between mb-4 items-start">
        <div className="flex items-center gap-3">
          {review.avatar ? (
            <img 
              src={review.avatar} 
              alt={review.author} 
              className="w-10 h-10 rounded-full object-cover border-2 border-persian-gold/20"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-persian-navy/10 flex items-center justify-center">
              <User size={20} className="text-persian-navy" />
            </div>
          )}
          <div>
            <h4 className="font-bold text-persian-navy">{review.author}</h4>
            <p className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <StarRating rating={review.rating} />
          {review.source === "google" && (
            <span className="text-xs mt-1 italic text-gray-500">via Google</span>
          )}
        </div>
      </div>
      <div className="relative mt-2">
        <Quote className="absolute top-0 left-0 text-persian-gold/20 -translate-x-1 -translate-y-1" size={18} />
        <p className="pl-4 text-gray-600 italic">{review.content}</p>
      </div>
    </div>
  );
};

interface ReviewFormProps {
  onSubmitReview: (review: Omit<Review, 'id' | 'date' | 'source'>) => void;
}

const ReviewForm = ({ onSubmitReview }: ReviewFormProps) => {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !content) return;
    
    onSubmitReview({
      author: name,
      rating,
      content,
    });
    
    // Reset form
    setName("");
    setContent("");
    setRating(5);
    setSubmitted(true);
    
    // Reset success message after delay
    setTimeout(() => {
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-persian-gold/20">
      <h3 className="text-xl font-playfair font-bold text-persian-navy mb-4">Share Your Experience</h3>
      
      {submitted ? (
        <div className="bg-green-50 text-green-700 p-4 rounded-md border border-green-200 mb-6 animate-fade-in">
          Thank you for your review! It will be displayed after moderation.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-persian-gold focus:border-persian-gold"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star 
                    size={24} 
                    className={star <= rating ? "text-persian-gold fill-persian-gold" : "text-gray-300 hover:text-persian-gold/50"} 
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
            <textarea
              id="review"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-persian-gold focus:border-persian-gold"
              required
            ></textarea>
          </div>
          
          <button
            type="submit"
            className="px-4 py-2 bg-persian-gold text-persian-navy rounded-md hover:bg-persian-gold/90 transition-colors"
          >
            Submit Review
          </button>
        </form>
      )}
    </div>
  );
};

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [activeFilter, setActiveFilter] = useState<"all" | "google" | "site">("all");

  const filteredReviews = activeFilter === "all" 
    ? reviews 
    : reviews.filter(review => review.source === activeFilter);

  const handleSubmitReview = (newReview: Omit<Review, 'id' | 'date' | 'source'>) => {
    const review: Review = {
      ...newReview,
      id: `rev-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      source: "site",
    };
    
    setReviews([review, ...reviews]);
  };

  return (
    <section id="reviews" className="py-20 relative overflow-hidden bg-persian-cream/50">
      {/* Decorative elements */}
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-persian-gold/5 blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-persian-gold/5 blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-2 text-persian-navy animate-fade-in">
            Our <span className="text-persian-gold">Reviews</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto animate-fade-in" style={{animationDelay: "0.2s"}}>
            Scopri cosa dicono i nostri clienti delle nostre creazioni floreali
          </p>
        </div>
        
        <PatternDivider />
        
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-full shadow-md p-1">
            <button 
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-full transition-colors ${activeFilter === "all" ? "bg-persian-gold text-persian-navy" : "hover:bg-persian-gold/10"}`}
            >
              All Reviews
            </button>
            <button 
              onClick={() => setActiveFilter("google")}
              className={`px-4 py-2 rounded-full transition-colors ${activeFilter === "google" ? "bg-persian-gold text-persian-navy" : "hover:bg-persian-gold/10"}`}
            >
              Google Reviews
            </button>
            <button 
              onClick={() => setActiveFilter("site")}
              className={`px-4 py-2 rounded-full transition-colors ${activeFilter === "site" ? "bg-persian-gold text-persian-navy" : "hover:bg-persian-gold/10"}`}
            >
              Site Reviews
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {filteredReviews.map((review, index) => (
            <div
              key={review.id}
              className="animate-fade-in"
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <ReviewCard review={review} />
            </div>
          ))}
        </div>
        
        <div className="max-w-2xl mx-auto">
          <ReviewForm onSubmitReview={handleSubmitReview} />
        </div>
      </div>
    </section>
  );
};

export default Reviews;
