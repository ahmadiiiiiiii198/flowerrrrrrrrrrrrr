import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import OrderForm from '../components/OrderForm';

const Order = () => {
  return (
    <div className="min-h-screen font-inter bg-gradient-to-br from-peach-50/30 via-white to-amber-50/30">
      <Header />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4 font-playfair">
              Place Your Order
            </h1>
            <p className="text-xl text-gray-600 font-inter max-w-2xl mx-auto">
              Tell us about your floral needs and we'll create something beautiful for you. 
              Our expert florists will contact you to confirm details and provide a final quote.
            </p>
          </div>

          <OrderForm />

          {/* Additional Information */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-peach-100">
              <div className="w-12 h-12 bg-peach-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📞</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Personal Consultation</h3>
              <p className="text-gray-600 text-sm">
                We'll call you within 24 hours to discuss your requirements and provide expert advice.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-peach-100">
              <div className="w-12 h-12 bg-peach-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Transparent Pricing</h3>
              <p className="text-gray-600 text-sm">
                The estimated price shown is preliminary. Final pricing will be confirmed before we proceed.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-peach-100">
              <div className="w-12 h-12 bg-peach-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚚</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Flexible Delivery</h3>
              <p className="text-gray-600 text-sm">
                We offer delivery throughout the region. Delivery costs will be calculated based on your location.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 font-playfair">
              Need Help?
            </h2>
            <p className="text-gray-600 mb-6">
              Our team is here to help you create the perfect floral arrangement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+393498851455"
                className="inline-flex items-center justify-center px-6 py-3 bg-peach-500 text-white rounded-lg hover:bg-peach-600 transition-colors"
              >
                📞 Call Us: +393498851455
              </a>
              <a
                href="mailto:Dbrfnc56m31@gmail.com"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-peach-600 border border-peach-300 rounded-lg hover:bg-peach-50 transition-colors"
              >
                ✉️ Email: Dbrfnc56m31@gmail.com
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Order;
