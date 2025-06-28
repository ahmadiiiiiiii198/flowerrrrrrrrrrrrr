import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCart } from '@/hooks/use-cart';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import CartCheckoutModal from './CartCheckoutModal';

interface ShoppingCartProps {
  children: React.ReactNode;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({ children }) => {
  const cart = useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      cart.removeItem(productId);
    } else {
      cart.updateQuantity(productId, newQuantity);
    }
  };

  const handleSpecialRequestsChange = (productId: string, specialRequests: string) => {
    cart.updateSpecialRequests(productId, specialRequests);
  };

  return (
    <>
      <Sheet open={cart.isOpen} onOpenChange={cart.setIsOpen}>
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart size={20} />
              Carrello ({cart.getTotalItems()})
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col h-full">
            {cart.items.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Il tuo carrello è vuoto</p>
                  <p className="text-sm text-gray-400 mt-2">Aggiungi alcuni prodotti per iniziare</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                  {cart.items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.svg';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
                          <p className="text-sm text-gray-600">€{item.product.price.toFixed(2)} cad.</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus size={14} />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus size={14} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cart.removeItem(item.product.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">
                            €{(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`special-requests-${item.id}`} className="text-xs">
                          Richieste Speciali
                        </Label>
                        <Textarea
                          id={`special-requests-${item.id}`}
                          value={item.specialRequests || ''}
                          onChange={(e) => handleSpecialRequestsChange(item.product.id, e.target.value)}
                          placeholder="Aggiungi note speciali per questo prodotto..."
                          className="text-xs min-h-[60px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Totale:</span>
                    <span className="font-bold text-lg">€{cart.getTotalPrice().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={cart.clearCart}
                      className="flex-1"
                    >
                      Svuota Carrello
                    </Button>
                    <Button
                      onClick={() => setIsCheckoutOpen(true)}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                    >
                      <CreditCard size={16} className="mr-2" />
                      Checkout
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CartCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart.items}
        totalAmount={cart.getTotalPrice()}
      />
    </>
  );
};

export default ShoppingCart;
