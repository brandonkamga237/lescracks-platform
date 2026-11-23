import SEO from '@/components/common/SEO';
import LegalDocument, { type LegalSection } from '@/components/site/LegalDocument';

const SECTIONS: LegalSection[] = [
  { title: 'Objet du service', paragraphs: ['LesCracks propose des articles, des rendez-vous et des contenus autour de la technologie. L\'accès au catalogue est public ; certaines fonctionnalités nécessitent la création d\'un compte.'] },
  { title: 'Compte utilisateur', paragraphs: ['L\'utilisateur s\'engage à fournir des informations exactes et à maintenir la confidentialité de ses identifiants. Les comptes peuvent être suspendus en cas de non-respect des règles.'] },
  { title: 'Propriété intellectuelle', paragraphs: ['Les contenus publiés sur LesCracks sont protégés. Toute reproduction ou diffusion sans autorisation est interdite.'] },
  { title: 'Modification des conditions', paragraphs: ['LesCracks se réserve le droit de modifier les présentes conditions à tout moment. L\'utilisateur est invité à les consulter régulièrement.'] },
];

export default function Terms() {
  return (
    <>
      <SEO title="Conditions d'utilisation" description="Les conditions d'utilisation de la plateforme LesCracks." url="/conditions-utilisation" />
      <LegalDocument id="terms-title" title="Conditions d'utilisation" lead="Les présentes conditions régissent l'utilisation de la plateforme LesCracks. En accédant au site, tu acceptes ces conditions dans leur intégralité." sections={SECTIONS} />
    </>
  );
}
