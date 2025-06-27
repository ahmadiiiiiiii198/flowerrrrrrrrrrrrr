import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import OrderForm from '../components/OrderForm';

const Order = () => {
  return (
    <div className="min-h-screen font-inter bg-gradient-to-br from-emerald-50/30 via-white to-amber-50/30">
      <Header />

      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-white to-emerald-50 rounded-full flex items-center justify-center mr-4 shadow-lg overflow-hidden border-2 border-emerald-200">
                <img
                  src="https://despodpgvkszyexvcbft.supabase.co/storage/v1/object/public/uploads/logos/1749735172947-oi6nr6gnk7.png"
                  alt="Francesco Fiori & Piante Logo"
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    // Fallback to botanical emoji if logo fails to load
                    e.currentTarget.style.display = 'none';
                    const fallback = document.createElement('span');
                    fallback.className = 'text-3xl';
                    fallback.textContent = '🌿';
                    e.currentTarget.parentElement!.appendChild(fallback);
                  }}
                />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-800 mb-6 font-serif">
              Francesco Fiori & Piante
            </h1>
            <h2 className="text-3xl font-semibold text-emerald-700 mb-4">
              Effettua il Tuo Ordine
            </h2>
            <p className="text-xl text-gray-600 font-inter max-w-3xl mx-auto leading-relaxed">
              Raccontaci delle tue esigenze floreali e creeremo qualcosa di bello per te.
              I nostri esperti fioristi ti contatteranno per confermare i dettagli e fornire un preventivo finale.
            </p>
          </div>

          <OrderForm />

          {/* Additional Information */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-emerald-200">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📞</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Consulenza Personalizzata</h3>
              <p className="text-gray-600 leading-relaxed">
                Ti chiameremo entro 24 ore per discutere le tue esigenze e fornire consigli esperti.
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-amber-200">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Prezzi Trasparenti</h3>
              <p className="text-gray-600 leading-relaxed">
                Il prezzo stimato mostrato è preliminare. Il prezzo finale sarà confermato prima di procedere.
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-green-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🚚</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Consegna Flessibile</h3>
              <p className="text-gray-600 leading-relaxed">
                Offriamo consegne in tutta la regione. I costi di consegna saranno calcolati in base alla tua posizione.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-20 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 font-serif">
              Hai Bisogno di Aiuto?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Il nostro team è qui per aiutarti a creare la composizione floreale perfetta.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a
                href="tel:+393498851455"
                className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold text-lg shadow-lg"
              >
                📞 Chiamaci: +393498851455
              </a>
              <a
                href="mailto:Dbrfnc56m31@gmail.com"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-700 border-2 border-emerald-300 rounded-xl hover:bg-emerald-50 transition-colors font-semibold text-lg shadow-lg"
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
