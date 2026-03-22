// src/components/landing/FAQ.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const faqs = [
  {
    question: 'Combien de temps faut-il pour transformer son profil?',
    answer: 'Notre programme principal dure entre 5 et 6 mois. Cela depend de votre niveau de depart et de votre engagement. Nous accompagnons chaque participant de maniere personnalisee.',
  },
  {
    question: 'Quelles sont les precondition pour postuler?',
    answer: 'Nous cherchons des personnes motivees avec une_base en programmation ou une forte appetence pour la tech. Un entretien nous permet d\'evaluer votre potentiel et votre motivation.',
  },
  {
    question: 'Les formations sont-elles certifiees?',
    answer: 'Oui, toutes nos formations delivrent une certification reconnue. Nos certificats sont verifies par les entreprises partenaires et attestent de vos competences reelles.',
  },
  {
    question: 'Qu\'entendez vous par utilisateur premium ? ',
    answer: 'Nos utilisateurs premium son des dabord des utilisateurs classiques mais aussi des utilisateurs qui ont acces a tous nous ressources et evenements quelques soit la restriction avec une baisse pouvant aller jusqu\'a 30% du prix de nos differents forme d\'accompagnemnt',
  },
  {
    question: 'Proposez-vous des financements ou paiements echelonnes?',
    answer: 'Oui, nous proposons plusieurs options: paiement integral, echelonnement sur des periodes fixes, et des reductions considerables pour nos utilisateurs premium. Contactez-nous pour discuter de votre situation.',
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { isDark } = useTheme();

  return (
    <section className="py-24 relative overflow-hidden theme-transition">
      {/* Background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-transparent via-gold/20 to-transparent" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className={`text-3xl md:text-4xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Questions <span className="text-gold">frequentes</span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className={`w-full flex items-center justify-between p-6 border transition-colors text-left group theme-transition ${
                  isDark 
                    ? 'bg-black border-white/5 hover:border-gold/30' 
                    : 'bg-white border-gray-200 hover:border-gold/30'
                }`}
              >
                <span className={`font-medium pr-4 group-hover:text-gold transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gold flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className={`p-6 pt-0 leading-relaxed ${isDark ? 'text-white/50' : 'text-gray-600'}`}>
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
