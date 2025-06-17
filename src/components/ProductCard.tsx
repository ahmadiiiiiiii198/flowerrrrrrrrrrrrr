
import React from 'react';
import { ShoppingCart, Eye, Tag } from 'lucide-react';
import { Product } from '@/types/category';
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
  // Use product data if available, otherwise fall back to legacy props
  const productName = product?.name || name || '';
  const productPrice = product ? `€${product.price.toFixed(2)}` : price || '';
  const productImage = product?.image_url || image || '';
  const productDescription = product?.description || description || '';
  const isAvailable = product?.is_available !== false;
  const stockQuantity = product?.stock_quantity || 0;

  const handleOrderClick = () => {
    if (product && onOrder && isAvailable) {
      onOrder(product);
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

          {product && onOrder ? (
            <button
              onClick={handleOrderClick}
              disabled={!isAvailable}
              className={`p-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 group/btn ${
                isAvailable
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={isAvailable ? 'Ordina ora' : 'Non disponibile'}
            >
              <ShoppingCart size={20} className={isAvailable ? 'group-hover/btn:animate-bounce' : ''} />
            </button>
          ) : (
            <button className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-3 rounded-full hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 group/btn">
              <ShoppingCart size={20} className="group-hover/btn:animate-bounce" />
            </button>
          )}
        </div>

        {/* Category badge */}
        {product && (
          <div className="mt-3">
            <span className="inline-block bg-peach-100 text-peach-800 px-2 py-1 rounded-full text-xs font-medium">
              {product.category}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
