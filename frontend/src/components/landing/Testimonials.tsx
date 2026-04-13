import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const testimonials = [
  {
    name: 'Daniel Vahid Kegne',
    role: 'Etudiant en licence 2 a UY1',
    company: 'Yaounde, Cameroun',
    quote: "J'ai suivi le parcours propose par leur academie et je suis passe de noob a developpeur frontend junior. Une transformation incredible en quelques mois.",
  },
  {
    name: 'Kegne Joyce',
    role: 'Etudiant en licence 2 a UY1',
    company: 'Yaounde, Cameroun',
    quote: "J'ai toujours voulu devenir ingenieur logiciel. Je pense que LesCracks Academy a joue un grand role dans l'accomplissement de cette rever.",
  },
  {
    name: 'Cedrik Darek Yegmo',
    role: 'CEO de XyberClan',
    company: 'Douala, Cameroun',
    quote: "D'etudiant a CEO de ma startup XyberClan, je ne peut que feliciter l'equipe de LesCracks qui m'a forme et inspire dans mon parcours.",
  },
  {
    name: 'Marie L.',
    role: 'Developpeuse Full Stack',
    company: 'Paris, France',
    quote: "En 6 mois, j'ai transforme ma carriere. Le programme m'a donne les competencias et la confiance necessaires pour reintegrer le marche tech.",
  },
  {
    name: 'Aminata S.',
    role: 'Etudiante en informatique',
    company: 'Abidjan, Cote dIvoire',
    quote: "Une formation de qualite accessible depuis l'Afrique. Le mentorat individualise m'a permis de progreser tres rapidement.",
  },
  {
    name: 'Thomas M.',
    role: 'Backend Engineer',
    company: 'Lyon, France',
    quote: "L'accompagnement personnalise fait toute la difference. Les projets Open Source m'ont permis de construire un portfolio solide.",
  },
];

const Testimonials = () => {
  const [showAll, setShowAll] = useState(false);
  const visibleCount = 3;
  const { isDark } = useTheme();

  return (
    <section className={`py-24 relative theme-transition ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-100'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className={`text-3xl md:text-4xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Ils ont <span className="text-gold">reussi</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {(showAll ? testimonials : testimonials.slice(0, visibleCount)).map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  filter: 'blur(0px)',
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.9,
                  transition: { duration: 0.3 }
                }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`p-8 border transition-colors theme-transition ${
                  isDark 
                    ? 'bg-black border-white/5 hover:border-gold/20' 
                    : 'bg-white border-gray-200 hover:border-gold/30'
                }`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                    isDark ? 'bg-gold/15 text-gold border border-gold/20' : 'bg-gold/20 text-gold border border-gold/30'
                  }`}>
                    {testimonial.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{testimonial.name}</p>
                    <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{testimonial.role}</p>
                  </div>
                </div>
                <p className={`leading-relaxed mb-4 ${isDark ? 'text-white/50' : 'text-gray-600'}`}>
                  "{testimonial.quote}"
                </p>
                <p className="text-xs text-gold">{testimonial.company}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {!showAll && testimonials.length > visibleCount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative mt-8"
          >
            {/* Gradient fade effect */}
            <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-t pointer-events-none ${isDark ? 'from-[#0a0a0a]' : 'from-gray-100'} to-transparent`} />
            
            <div className="text-center pt-8">
              <button
                onClick={() => setShowAll(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-black font-semibold hover:bg-gold-light transition-colors"
              >
                Voir tous les commentaires
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {showAll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-8"
          >
            <button
              onClick={() => setShowAll(false)}
              className={`inline-flex items-center gap-2 px-6 py-3 border transition-colors ${
                isDark 
                  ? 'border-white/10 text-white/60 hover:text-white hover:border-gold/30' 
                  : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gold/30'
              }`}
            >
              Reduire
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
