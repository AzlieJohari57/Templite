import React, { useState } from 'react';
import { ShoppingBag, MessageCircle, ArrowLeft } from 'lucide-react';
import Header from './Header';
import { translations, Language } from '../translations';

interface OrderVerificationProps {
  onVerify: (phone: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isDarkMode: boolean;
  onDarkModeToggle: () => void;
}

type Flow = null | 'shopee' | 'whatsapp';

const OrderVerification: React.FC<OrderVerificationProps> = ({
  onVerify,
  language,
  onLanguageChange,
  isDarkMode,
  onDarkModeToggle,
}) => {
  const t = translations[language].orderVerification;
  const [flow, setFlow] = useState<Flow>(null);
  const [shopeeId, setShopeeId] = useState('');
  const [whatsappNum, setWhatsappNum] = useState('');

  const sendToSheet = (channel: 'Shopee' | 'WhatsApp', value: string, sessionId: string) => {
    fetch('/api/log-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', sessionId, channel, value, language }),
    }).catch(() => {});
  };

  const handleConfirm = () => {
    const sessionId = crypto.randomUUID();
    sessionStorage.setItem('templite_session_id', sessionId);
    if (flow === 'shopee') {
      sendToSheet('Shopee', shopeeId.trim(), sessionId);
      onVerify('');
    } else if (flow === 'whatsapp') {
      sendToSheet('WhatsApp', whatsappNum.trim(), sessionId);
      onVerify('');
    }
  };

  const handleShopeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setShopeeId(cleaned);
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^0-9]/g, '');
    setWhatsappNum(cleaned);
  };

  const shopeeValid = shopeeId.length >= 10 && shopeeId.length <= 20;
  const whatsappValid = whatsappNum.length >= 8 && whatsappNum.length <= 15;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <Header
        selectedLanguage={language}
        onLanguageChange={onLanguageChange}
        isDarkMode={isDarkMode}
        onDarkModeToggle={onDarkModeToggle}
      />

      <div className="flex items-center justify-center min-h-[calc(100vh-60px)] px-4 py-10">
        <div className="w-full max-w-2xl">

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
            {t.thankYou}
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 text-sm sm:text-base">
            {t.orderFrom}
          </p>

          {/* Channel selection */}
          {flow === null && (
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setFlow('shopee')}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-lg transition-colors text-sm sm:text-base"
              >
                <ShoppingBag className="w-5 h-5" />
                {t.shopee}
              </button>
              <button
                onClick={() => setFlow('whatsapp')}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-lg transition-colors text-sm sm:text-base"
              >
                <MessageCircle className="w-5 h-5" />
                {t.whatsapp}
              </button>
            </div>
          )}

          {/* Shopee flow */}
          {flow === 'shopee' && (
            <div className="space-y-5">
              <button
                onClick={() => { setFlow(null); setShopeeId(''); }}
                className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {t.back}
              </button>

              <p className="text-center font-semibold text-gray-800 dark:text-gray-200">
                {t.fillShopeeId}
              </p>

              <input
                type="text"
                value={shopeeId}
                onChange={handleShopeeChange}
                placeholder={t.shopeePlaceholder}
                maxLength={20}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-mono tracking-wider"
              />
              {shopeeId.length > 0 && shopeeId.length < 10 && (
                <p className="text-xs text-red-500 -mt-2">
                  {language === 'English' ? `Minimum 10 characters (${shopeeId.length}/10)` : `Minimum 10 aksara (${shopeeId.length}/10)`}
                </p>
              )}

              {/* Shopee example card */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-7 h-7 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Service Buat Resume 2 Jam BM|ENG (Prem...</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">H.1 Hari Siap &nbsp; x1</p>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">RM9.99</p>
                    <p className="text-xs font-bold text-orange-500 mt-1">{t.exampleLabel}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t.orderIdLabel}:</span>
                  <span className="text-xs font-mono font-semibold text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {t.shopeePlaceholder}
                  </span>
                  <span className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">COPY</span>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleConfirm}
                  disabled={!shopeeValid}
                  className="px-10 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-md transition-colors"
                >
                  {t.confirm}
                </button>
              </div>
            </div>
          )}

          {/* Whatsapp flow */}
          {flow === 'whatsapp' && (
            <div className="space-y-5">
              <button
                onClick={() => { setFlow(null); setWhatsappNum(''); }}
                className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {t.back}
              </button>

              <p className="text-center font-semibold text-gray-800 dark:text-gray-200">
                {t.fillWhatsapp}
              </p>

              <input
                type="text"
                inputMode="numeric"
                value={whatsappNum}
                onChange={handleWhatsappChange}
                placeholder={t.whatsappPlaceholder}
                maxLength={15}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-mono tracking-wider"
              />
              {whatsappNum.length > 0 && whatsappNum.length < 8 && (
                <p className="text-xs text-red-500 -mt-2">
                  {language === 'English' ? `Minimum 8 digits (${whatsappNum.length}/8)` : `Minimum 8 digit (${whatsappNum.length}/8)`}
                </p>
              )}

              {/* Whatsapp example card */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.numberPhoneLabel}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-red-500">{t.exampleLabel}</span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-white">{t.whatsappPlaceholder}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleConfirm}
                  disabled={!whatsappValid}
                  className="px-10 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-md transition-colors"
                >
                  {t.confirm}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderVerification;
