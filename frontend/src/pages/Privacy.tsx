import SEO from '@/components/common/SEO';
import LegalDocument, { type LegalSection } from '@/components/site/LegalDocument';

const SECTIONS: LegalSection[] = [
  {
    title: 'Données collectées',
    paragraphs: [
      'Lors de l\'inscription, nous collectons ton nom, ton adresse email et les informations de connexion. Ces données sont nécessaires au fonctionnement du service.',
      'Nous te demandons aussi, sans obligation, ton numéro de téléphone (le pays de ton compte est déduit de son indicatif), ta ville, ta situation (études, emploi, reconversion…), ton objectif et tes centres d\'intérêt. Tu peux les modifier ou les retirer à tout moment depuis ton profil.',
      'Nous enregistrons enfin, une seule fois, la page par laquelle tu es arrivé sur le site, la langue de ton navigateur et ton fuseau horaire.',
    ],
  },
  {
    title: 'Utilisation des données',
    paragraphs: [
      'Les données servent à gérer ton compte, à te donner accès aux contenus, à te proposer des ressources et des ateliers adaptés à ton profil, et à savoir où organiser les prochains rendez-vous. Si tu y consens, elles servent aussi à t\'envoyer la newsletter.',
      'Ton numéro de téléphone n\'est jamais affiché publiquement. Nous ne t\'écrivons par WhatsApp ou par SMS que si tu as coché la case prévue à cet effet ; tu peux la décocher à tout moment depuis ton profil.',
    ],
  },
  { title: 'Partage et sécurité', paragraphs: ['Les données ne sont pas revendues. L\'accès aux informations est sécurisé et limité aux seules finalités du service.'] },
  { title: 'Droits des utilisateurs', paragraphs: ['Tu peux demander la modification ou la suppression de tes données à tout moment en contactant l\'équipe LesCracks.'] },
];

export default function Privacy() {
  return (
    <>
      <SEO title="Politique de confidentialité" description="Comment LesCracks protège et utilise tes données personnelles." url="/politique-confidentialite" />
      <LegalDocument id="privacy-title" title="Politique de confidentialité" lead="LesCracks respecte ta vie privée. Cette politique explique quelles données sont collectées, comment elles sont utilisées et comment elles sont protégées." sections={SECTIONS} />
    </>
  );
}
