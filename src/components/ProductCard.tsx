
import React from 'react';
import { ShoppingCart, Eye, Tag } from 'lucide-react';
import { Product } from '@/types/category';

import { useToast } from '@/hooks/use-toast';
import { useSimpleCart } from '@/hooks/use-simple-cart';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product?: Product;
  // Legacy props for backward compatibility
  name?: string;
  price?: string;
  image?: string;
  description?: string;
  onOrder?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  name,
  price,
  image,
  description,
  onOrder,
  onViewDetails
}) => {
  const { toast } = useToast();
  const { addItem } = useSimpleCart();

  // Use product data if available, otherwise fall back to legacy props
  const productName = product?.name || name || '';
  const productPrice = product ? `€${product.price.toFixed(2)}` : price || '';
  const productImage = product?.image_url || image || '';
  const productDescription = product?.description || description || '';
  const isAvailable = product?.is_available !== false;
  const stockQuantity = product?.stock_quantity || 0;

  const handleOrderClick = () => {
    if (product && isAvailable) {
      addItem(product, 1);
      toast({
        title: 'Prodotto aggiunto al carrello! 🛒',
        description: `${product.name} è stato aggiunto al tuo carrello.`,
      });
    }
  };

  const handleViewDetails = () => {
    if (product && onViewDetails) {
      onViewDetails(product);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-peach-50/30 rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-peach-100/50">
      <div className="relative overflow-hidden">
        <img
          src={productImage}
          alt={productName}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder.svg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-peach-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Category badge - top right */}
        {product && product.category && (
          <div className="absolute top-3 right-3">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm transition-all duration-200 ${
              product.category.toLowerCase() === 'naturale'
                ? 'bg-emerald-500/90 text-white border border-emerald-400/50'
                : product.category.toLowerCase() === 'finti'
                ? 'bg-amber-500/90 text-white border border-amber-400/50'
                : 'bg-peach-500/90 text-white border border-peach-400/50'
            }`}>
              <Tag size={10} />
              {product.category}
            </span>
          </div>
        )}

        {/* Stock indicator */}
        {product && (
          <div className="absolute top-3 left-3">
            {!isAvailable ? (
              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                Non Disponibile
              </span>
            ) : stockQuantity <= 5 && stockQuantity > 0 ? (
              <span className="bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                Ultimi {stockQuantity}
              </span>
            ) : null}
          </div>
        )}

        {/* Product Labels overlay on images */}
        {product && product.labels && product.labels.length > 0 && (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
            {product.labels.map((label, index) => (
              <Badge
                key={index}
                variant="outline"
                className="bg-white/90 text-blue-700 border-blue-200 text-xs backdrop-blur-sm"
              >
                <Tag className="w-3 h-3 mr-1" />
                {label}
              </Badge>
            ))}
          </div>
        )}

        {/* Action buttons overlay */}
        {product && (onOrder || onViewDetails) && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
            {onViewDetails && (
              <button
                onClick={handleViewDetails}
                className="bg-white/90 backdrop-blur-sm text-gray-700 p-2 rounded-full hover:bg-white transition-all duration-300 shadow-lg"
                title="Visualizza dettagli"
              >
                <Eye size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2 font-playfair">{productName}</h3>
        <p className="text-gray-600 mb-4 text-sm font-inter line-clamp-2">{productDescription}</p>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-coral-600 font-playfair">
            {productPrice}
          </span>

          {product ? (
            <button
              onClick={handleOrderClick}
              disabled={!isAvailable}
              className={`p-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 group/btn ${
                isAvailable
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={isAvailable ? 'Aggiungi al carrello' : 'Non disponibile'}
            >
              <ShoppingCart size={20} className={isAvailable ? 'group-hover/btn:animate-bounce' : ''} />
            </button>
          ) : (
            <button className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-3 rounded-full hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 group/btn">
              <ShoppingCart size={20} className="group-hover/btn:animate-bounce" />
            </button>
          )}
        </div>

        {/* Category badge - Enhanced styling */}
        {product && product.category && (
          <div className="mt-3">
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all duration-200 hover:shadow-md ${
              product.category.toLowerCase() === 'naturale'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                : product.category.toLowerCase() === 'finti'
                ? 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200'
                : 'bg-peach-100 text-peach-800 border border-peach-200 hover:bg-peach-200'
            }`}>
              <Tag size={12} />
              {product.category}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
