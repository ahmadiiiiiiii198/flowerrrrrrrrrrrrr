
import React from 'react';
import { Flower } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

const About = () => {
  const { language, t } = useLanguage();

  // Multilingual content
  const content = {
    it: {
      title: 'Chi Siamo - Francesco Fiori & Piante',
      storyTitle: 'La Nostra Storia',
      paragraph1: 'Francesco Fiori & Piante nasce dalla passione per la bellezza naturale e dall\'esperienza artigianale tramandata nel tempo. Dai momenti più delicati come i funerali, ai giorni più belli come i matrimoni, offriamo composizioni floreali create con amore e cura.',
      paragraph2: 'Le nostre creazioni nascono da una profonda passione per la bellezza naturale. Solo fiori selezionati, solo eleganza made in Torino. 🌼 Situati all\'interno del Mercato di Porta Palazzo, offriamo esperienza artigianale e passione per la bellezza naturale.',
      quote: '📍 Trovaci a Porta Palazzo, Torino – nel cuore del mercato più vivace e colorato della città.',
      quoteAuthor: 'Un viaggio tra profumi, colori e armonie floreali',
      servicesTitle: 'Nel nostro negozio puoi trovare:',
      services: [
        'Fiori freschi per ogni occasione',
        'Piante da interno ed esterno per decorare con la natura',
        'Fiori finti di alta qualità, ideali per decorazioni durature',
        'Servizi floreali su misura per cerimonie, eventi e ambienti'
      ],
      stats: {
        years: 'Anni di Esperienza',
        customers: 'Clienti Felici',
        varieties: 'Varietà di Fiori'
      },
      closingMessage: 'Vieni a trovarci da Francesco Fiori & Piante e porta un tocco di natura nella tua vita.',
      tagline: 'Creiamo bellezza, un fiore alla volta'
    },
    en: {
      title: 'About Francesco Fiori & Piante',
      storyTitle: 'Our Story',
      paragraph1: 'Francesco Fiori & Piante was born from a passion for natural beauty and artisanal experience passed down through time. From the most delicate moments like funerals, to the most beautiful days like weddings, we offer floral arrangements created with love and care.',
      paragraph2: 'Our creations are born from a deep passion for natural beauty. Only selected flowers, only elegance made in Turin. 🌼 Located inside the Porta Palazzo Market, we offer artisanal experience and passion for natural beauty.',
      quote: '📍 Find us at Porta Palazzo, Turin – in the heart of the city\'s most vibrant and colorful market.',
      quoteAuthor: 'A journey through scents, colors and floral harmonies',
      servicesTitle: 'In our shop you can find:',
      services: [
        'Fresh flowers for every occasion',
        'Indoor and outdoor plants to decorate with nature',
        'High quality fake flowers, ideal for long-lasting decorations',
        'Tailor-made floral services for ceremonies, events, and environments'
      ],
      stats: {
        years: 'Years Experience',
        customers: 'Happy Customers',
        varieties: 'Flower Varieties'
      },
      closingMessage: 'Come visit us at Francesco Fiori & Piante and bring a touch of nature into your life.',
      tagline: 'Creating beauty, one flower at a time'
    },
    fr: {
      title: 'À Propos de Francesco Fiori & Piante',
      storyTitle: 'Notre Histoire',
      paragraph1: 'Francesco Fiori & Piante est né d\'une passion pour la beauté naturelle et l\'expérience artisanale transmise à travers le temps. Des moments les plus délicats comme les funérailles, aux plus beaux jours comme les mariages, nous offrons des arrangements floraux créés avec amour et soin.',
      paragraph2: 'Nos créations naissent d\'une passion profonde pour la beauté naturelle. Seulement des fleurs sélectionnées, seulement l\'élégance made in Turin. 🌼 Situés à l\'intérieur du Marché de Porta Palazzo, nous offrons une expérience artisanale et une passion pour la beauté naturelle.',
      quote: '📍 Trouvez-nous à Porta Palazzo, Turin – au cœur du marché le plus vivant et coloré de la ville.',
      quoteAuthor: 'Un voyage à travers les parfums, couleurs et harmonies florales',
      servicesTitle: 'Dans notre boutique vous pouvez trouver:',
      services: [
        'Fleurs fraîches pour chaque occasion',
        'Plantes d\'intérieur et d\'extérieur pour décorer avec la nature',
        'Fleurs artificielles de haute qualité, idéales pour des décorations durables',
        'Services floraux sur mesure pour cérémonies, événements et environnements'
      ],
      stats: {
        years: 'Années d\'Expérience',
        customers: 'Clients Satisfaits',
        varieties: 'Variétés de Fleurs'
      },
      closingMessage: 'Venez nous rendre visite chez Francesco Fiori & Piante et apportez une touche de nature dans votre vie.',
      tagline: 'Créer la beauté, une fleur à la fois'
    },
    ar: {
      title: 'حول فرانشيسكو فيوري وبيانتي',
      storyTitle: 'قصتنا',
      paragraph1: 'ولد فرانشيسكو فيوري وبيانتي من شغف بالجمال الطبيعي والخبرة الحرفية المتوارثة عبر الزمن. من اللحظات الأكثر حساسية مثل الجنازات، إلى أجمل الأيام مثل حفلات الزفاف، نقدم تنسيقات زهرية مصنوعة بحب وعناية.',
      paragraph2: 'إبداعاتنا تولد من شغف عميق بالجمال الطبيعي. فقط زهور مختارة، فقط أناقة صنع في تورين. 🌼 تقع داخل سوق بورتا بالازو، نقدم خبرة حرفية وشغف بالجمال الطبيعي.',
      quote: '📍 اعثر علينا في بورتا بالازو، تورين – في قلب أكثر أسواق المدينة حيوية وألوانًا.',
      quoteAuthor: 'رحلة عبر العطور والألوان والتناغمات الزهرية',
      servicesTitle: 'في متجرنا يمكنك أن تجد:',
      services: [
        'زهور طازجة لكل مناسبة',
        'نباتات داخلية وخارجية للتزيين بالطبيعة',
        'زهور صناعية عالية الجودة، مثالية للديكورات طويلة الأمد',
        'خدمات زهرية مخصصة للاحتفالات والفعاليات والبيئات'
      ],
      stats: {
        years: 'سنوات الخبرة',
        customers: 'عملاء سعداء',
        varieties: 'أنواع الزهور'
      },
      closingMessage: 'تعال لزيارتنا في فرانشيسكو فيوري وبيانتي وأضف لمسة من الطبيعة إلى حياتك.',
      tagline: 'نخلق الجمال، زهرة واحدة في كل مرة'
    },
    fa: {
      title: 'درباره فرانچسکو فیوری و پیانته',
      storyTitle: 'داستان ما',
      paragraph1: 'فرانچسکو فیوری و پیانته از عشق به زیبایی طبیعی و تجربه صنعتگری که در طول زمان منتقل شده، متولد شد. از حساس‌ترین لحظات مانند تشییع جنازه، تا زیباترین روزها مانند عروسی، ما تنظیمات گل ارائه می‌دهیم که با عشق و مراقبت ساخته شده‌اند.',
      paragraph2: 'آثار ما از عشق عمیق به زیبایی طبیعی متولد می‌شوند. فقط گل‌های انتخابی، فقط ظرافت ساخت تورین. 🌼 واقع در داخل بازار پورتا پالازو، ما تجربه صنعتگری و عشق به زیبایی طبیعی ارائه می‌دهیم.',
      quote: '📍 ما را در پورتا پالازو، تورین پیدا کنید – در قلب پر جنب و جوش‌ترین و رنگارنگ‌ترین بازار شهر.',
      quoteAuthor: 'سفری در میان عطرها، رنگ‌ها و هارمونی‌های گل',
      servicesTitle: 'در فروشگاه ما می‌توانید پیدا کنید:',
      services: [
        'گل‌های تازه برای هر مناسبت',
        'گیاهان داخلی و خارجی برای تزیین با طبیعت',
        'گل‌های مصنوعی با کیفیت بالا، ایده‌آل برای تزیینات بادوام',
        'خدمات گل سفارشی برای مراسم، رویدادها و محیط‌ها'
      ],
      stats: {
        years: 'سال تجربه',
        customers: 'مشتریان خوشحال',
        varieties: 'انواع گل'
      },
      closingMessage: 'برای دیدن ما به فرانچسکو فیوری و پیانته بیایید و لمسی از طبیعت را به زندگی‌تان بیاورید.',
      tagline: 'خلق زیبایی، یک گل در هر زمان'
    }
  };

  const currentContent = content[language] || content.it;
  const image = 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';

  return (
    <section id="about" className="py-20 bg-gradient-to-br from-emerald-50 via-peach-50 to-amber-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <Flower className="mx-auto text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-coral-500 mb-4" size={48} />
            <h2 className="text-4xl font-bold text-gray-800 mb-6 font-playfair">{currentContent.title}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4 font-playfair">{currentContent.storyTitle}</h3>
              <p className="text-gray-600 mb-6 leading-relaxed font-inter">
                {currentContent.paragraph1}
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed font-inter">
                {currentContent.paragraph2}
              </p>

              {/* Services Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 font-playfair">{currentContent.servicesTitle}</h4>
                <ul className="space-y-2">
                  {currentContent.services.map((service, index) => (
                    <li key={index} className="flex items-start gap-3 text-gray-600 font-inter">
                      <div className="w-2 h-2 bg-gradient-to-r from-peach-400 to-coral-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{service}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-center p-4 bg-gradient-to-br from-peach-50 to-coral-50 rounded-xl">
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-peach-600 to-coral-600 font-playfair">20+</div>
                  <div className="text-sm text-gray-600 font-inter">{currentContent.stats.years}</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-700 font-playfair">5000+</div>
                  <div className="text-sm text-gray-600 font-inter">{currentContent.stats.customers}</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-coral-600 font-playfair">100+</div>
                  <div className="text-sm text-gray-600 font-inter">{currentContent.stats.varieties}</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <img 
                  src={image}
                  alt="Francesco Florist at work"
                  className="rounded-xl"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-gradient-to-br from-white to-peach-50 p-6 rounded-xl shadow-lg border border-peach-200 max-w-sm">
                <p className="text-sm font-semibold text-gray-800 font-playfair mb-3">{currentContent.quote}</p>
                {currentContent.quote && (
                  <ul className="text-xs text-gray-600 font-inter space-y-1">
                    {currentContent.services.map((service, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-peach-500 mr-2">•</span>
                        <span>{service}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {currentContent.quoteAuthor && (
                  <p className="text-xs text-gray-600 font-inter italic mt-2">{currentContent.quoteAuthor}</p>
                )}
              </div>
            </div>
          </div>

          {/* Closing Message */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-br from-white to-peach-50 p-8 rounded-2xl shadow-lg border border-peach-200 max-w-3xl mx-auto">
              <p className="text-lg text-gray-700 font-inter leading-relaxed mb-4">
                {currentContent.closingMessage}
              </p>
              <div className="flex items-center justify-center gap-2 text-peach-600">
                <Flower size={20} />
                <span className="text-sm font-medium">{currentContent.tagline}</span>
                <Flower size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
