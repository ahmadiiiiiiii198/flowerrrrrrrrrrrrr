import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Star, Trash, AlertCircle, ExternalLink, FileText, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Review {
  id: string;
  author: string;
  rating: number;
  content: string;
  date: string;
  source: "site" | "google";
  approved: boolean;
  avatar?: string;
}

const initialReviews: Review[] = [
  {
    id: "rev1",
    author: "Amir Kazemi",
    rating: 5,
    content: "The best Central Asian food I've ever had! The Plov was absolutely authentic and reminded me of my grandmother's cooking.",
    date: "2023-12-15",
    source: "google",
    approved: true,
    avatar: "https://i.pravatar.cc/150?img=3"
  },
  {
    id: "rev2",
    author: "Sarah Johnson",
    rating: 5,
    content: "Incredible atmosphere and even better food! The Shashlik was grilled to perfection and the service was impeccable.",
    date: "2024-01-22",
    source: "google",
    approved: true,
    avatar: "https://i.pravatar.cc/150?img=5"
  },
  {
    id: "rev3",
    author: "Mikhail Petrov",
    rating: 4,
    content: "Very authentic Uzbek cuisine. The ambiance transports you to Central Asia and the flavors are bold and delicious.",
    date: "2024-02-10",
    source: "site",
    approved: true,
    avatar: "https://i.pravatar.cc/150?img=8"
  },
  {
    id: "rev4",
    author: "Emily Wong",
    rating: 5,
    content: "Came here for a special occasion and was blown away. The Saffron Rice Pudding is to die for! Will definitely be back.",
    date: "2024-03-05",
    source: "site",
    approved: true,
    avatar: "https://i.pravatar.cc/150?img=9"
  },
  {
    id: "rev5",
    author: "John Smith",
    rating: 3,
    content: "Food was good but service was a bit slow. Would probably give it another try though as the flavors were excellent.",
    date: "2024-04-12",
    source: "site",
    approved: false,
  }
];

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star 
          key={star} 
          size={14} 
          className={star <= rating ? "text-persian-gold fill-persian-gold" : "text-gray-300"} 
        />
      ))}
    </div>
  );
};

const ReviewsManager = () => {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [tabValue, setTabValue] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredReviews = reviews.filter(review => {
    if (tabValue === "all") return true;
    if (tabValue === "pending") return !review.approved;
    if (tabValue === "approved") return review.approved;
    if (tabValue === "google") return review.source === "google";
    if (tabValue === "site") return review.source === "site";
    return true;
  });

  const handleApproveReview = (id: string) => {
    setReviews(
      reviews.map(review => 
        review.id === id ? { ...review, approved: !review.approved } : review
      )
    );
    
    const review = reviews.find(r => r.id === id);
    
    toast({
      title: review?.approved ? "Review unapproved" : "Review approved",
      description: `The review from ${review?.author} has been ${review?.approved ? "hidden from" : "published to"} the website.`,
    });
  };

  const handleDeleteReview = (id: string) => {
    const reviewToDelete = reviews.find(review => review.id === id);
    setReviews(reviews.filter(review => review.id !== id));
    
    toast({
      title: "Review deleted",
      description: `The review from ${reviewToDelete?.author} has been permanently removed.`,
    });
  };

  const handleSyncGoogleReviews = () => {
    setIsRefreshing(true);
    setSyncDialogOpen(false);
    
    // Simulate API call to fetch Google reviews
    setTimeout(() => {
      // Simulate adding a new Google review
      const newGoogleReview: Review = {
        id: `rev-google-${Date.now()}`,
        author: "Alexandra Chen",
        rating: 5,
        content: "Absolutely wonderful experience! The food was fresh and delicious, and the service was exceptional. Will definitely return!",
        date: new Date().toISOString().split('T')[0],
        source: "google",
        approved: true,
        avatar: "https://i.pravatar.cc/150?img=20"
      };
      
      setReviews([newGoogleReview, ...reviews]);
      setIsRefreshing(false);
      
      toast({
        title: "Google reviews synced",
        description: "Latest reviews have been imported from Google.",
      });
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-playfair font-bold text-persian-navy">Reviews Manager</h2>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="border-persian-gold/30 text-persian-gold hover:bg-persian-gold/10 flex items-center gap-2"
            onClick={() => setSyncDialogOpen(true)}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Sync Google Reviews
          </Button>
        </div>
      </div>

      <Tabs value={tabValue} onValueChange={setTabValue} className="space-y-4 w-full">
        <TabsList className="bg-persian-cream/70 w-full overflow-x-auto flex whitespace-nowrap">
          <TabsTrigger value="all" className="data-[state=active]:bg-persian-gold data-[state=active]:text-persian-navy">
            All ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-persian-gold data-[state=active]:text-persian-navy">
            Pending ({reviews.filter(r => !r.approved).length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-persian-gold data-[state=active]:text-persian-navy">
            Approved ({reviews.filter(r => r.approved).length})
          </TabsTrigger>
          <TabsTrigger value="google" className="data-[state=active]:bg-persian-gold data-[state=active]:text-persian-navy">
            Google ({reviews.filter(r => r.source === "google").length})
          </TabsTrigger>
          <TabsTrigger value="site" className="data-[state=active]:bg-persian-gold data-[state=active]:text-persian-navy">
            Site ({reviews.filter(r => r.source === "site").length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={tabValue} className="w-full">
          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <FileText className="mx-auto text-gray-400 mb-2" size={48} />
                <h3 className="text-lg font-medium text-gray-900">No reviews</h3>
                <p className="text-gray-500 mt-1">There are no reviews in this category.</p>
              </div>
            ) : (
              filteredReviews.map(review => (
                <Card key={review.id} className={`overflow-hidden animate-fade-in ${!review.approved ? "border-l-4 border-l-amber-500" : ""}`}>
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {review.avatar ? (
                            <img 
                              src={review.avatar} 
                              alt={review.author} 
                              className="w-10 h-10 rounded-full object-cover border-2 border-persian-gold/20"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-persian-navy/10 flex items-center justify-center">
                              <Star size={16} className="text-persian-navy" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center flex-wrap gap-2">
                              <h4 className="font-bold text-persian-navy">{review.author}</h4>
                              {review.source === "google" && (
                                <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">Google</span>
                              )}
                              {!review.approved && (
                                <span className="bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                  <AlertCircle size={10} />
                                  Pending
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <StarRating rating={review.rating} />
                              <span className="text-xs text-gray-500">
                                {new Date(review.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Show on site</span>
                            <Switch 
                              checked={review.approved} 
                              onCheckedChange={() => handleApproveReview(review.id)}
                              className="data-[state=checked]:bg-persian-gold"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-gray-600 break-words">{review.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sync Google Reviews</DialogTitle>
            <DialogDescription>
              Import the latest reviews from your Google Business Profile. New reviews will be automatically approved.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-blue-50 text-blue-700 p-4 rounded-md border border-blue-200 flex items-start gap-2">
            <div className="mt-1">
              <AlertCircle size={16} />
            </div>
            <div>
              <p className="text-sm">Google reviews are read-only. You can hide them from your website, but you cannot edit or delete them on Google.</p>
              <a 
                href="https://business.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-700 hover:underline text-sm flex items-center mt-2 gap-1"
              >
                Manage Google reviews directly
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setSyncDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSyncGoogleReviews}
              className="bg-persian-gold text-persian-navy hover:bg-persian-gold/90"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw size={16} className="mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewsManager;
