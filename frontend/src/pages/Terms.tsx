import Layout from '@/components/layout/Layout';
import SEO from '@/components/common/SEO';

export default function Terms() {
  return <Layout>
    <SEO title="Conditions d'utilisation" description="Les conditions d'utilisation de la plateforme LesCracks." url="/conditions-utilisation" />
    <div className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-t1 sm:text-4xl">Conditions d'utilisation</h1>
      <p className="mt-6 text-t3 leading-relaxed">
        Les présentes conditions régissent l'utilisation de la plateforme LesCracks. En accédant au site, tu acceptes ces conditions dans leur intégralité.
      </p>
      <h2 className="mt-10 font-display text-xl font-semibold text-t1">1. Objet du service</h2>
      <p className="mt-4 text-t3 leading-relaxed">
        LesCracks propose des ressources, événements et contenus autour de la technologie. L'accès au catalogue est public ; certaines fonctionnalités nécessitent la création d'un compte.
      </p>
      <h2 className="mt-10 font-display text-xl font-semibold text-t1">2. Compte utilisateur</h2>
      <p className="mt-4 text-t3 leading-relaxed">
        L'utilisateur s'engage à fournir des informations exactes et à maintenir la confidentialité de ses identifiants. Les comptes peuvent être suspendus en cas de non-respect des règles.
      </p>
      <h2 className="mt-10 font-display text-xl font-semibold text-t1">3. Propriété intellectuelle</h2>
      <p className="mt-4 text-t3 leading-relaxed">
        Les contenus publiés sur LesCracks sont protégés. Toute reproduction ou diffusion sans autorisation est interdite.
      </p>
      <h2 className="mt-10 font-display text-xl font-semibold text-t1">4. Modification des conditions</h2>
      <p className="mt-4 text-t3 leading-relaxed">
        LesCracks se réserve le droit de modifier les présentes conditions à tout moment. L'utilisateur est invité à les consulter régulièrement.
      </p>
    </div>
  </Layout>;
}
