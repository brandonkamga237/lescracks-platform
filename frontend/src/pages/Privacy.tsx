import Layout from '@/components/layout/Layout';
import SEO from '@/components/common/SEO';

export default function Privacy() {
  return <Layout>
    <SEO title="Politique de confidentialité" description="Comment LesCracks protège et utilise tes données personnelles." url="/politique-confidentialite" />
    <div className="mode-raised"><div className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <div className="rounded-lg border border-line-soft bg-card p-6 sm:p-10">
        <p className="text-sm font-medium tracking-wide text-gold-ink">LesCracks / Confidentialité</p>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-t1 sm:text-4xl">Politique de confidentialité</h1>
        <p className="mt-6 text-t3 leading-relaxed">
          LesCracks respecte ta vie privée. Cette politique explique quelles données sont collectées, comment elles sont utilisées et comment elles sont protégées.
        </p>
        <h2 className="mt-10 font-display text-xl font-bold text-t1">1. Données collectées</h2>
        <p className="mt-4 text-t3 leading-relaxed">
          Lors de l'inscription, nous collectons ton nom, ton adresse email et les informations de connexion. Ces données sont nécessaires au fonctionnement du service.
        </p>
        <p className="mt-4 text-t3 leading-relaxed">
          Nous te demandons aussi, sans obligation, ton numéro de téléphone (le pays de ton compte est déduit de son indicatif), ta ville, ta situation (études, emploi, reconversion…), ton objectif et tes centres d'intérêt. Tu peux les modifier ou les retirer à tout moment depuis ton profil.
        </p>
        <p className="mt-4 text-t3 leading-relaxed">
          Nous enregistrons enfin, une seule fois, la page par laquelle tu es arrivé sur le site, la langue de ton navigateur et ton fuseau horaire.
        </p>
        <h2 className="mt-10 font-display text-xl font-bold text-t1">2. Utilisation des données</h2>
        <p className="mt-4 text-t3 leading-relaxed">
          Les données servent à gérer ton compte, à te donner accès aux contenus, à te proposer des ressources et des ateliers adaptés à ton profil, et à savoir où organiser les prochains événements. Si tu y consens, elles servent aussi à t'envoyer la newsletter.
        </p>
        <p className="mt-4 text-t3 leading-relaxed">
          Ton numéro de téléphone n'est jamais affiché publiquement. Nous ne t'écrivons par WhatsApp ou par SMS que si tu as coché la case prévue à cet effet ; tu peux la décocher à tout moment depuis ton profil.
        </p>
        <h2 className="mt-10 font-display text-xl font-bold text-t1">3. Partage et sécurité</h2>
        <p className="mt-4 text-t3 leading-relaxed">
          Les données ne sont pas revendues. L'accès aux informations est sécurisé et limité aux seules finalités du service.
        </p>
        <h2 className="mt-10 font-display text-xl font-bold text-t1">4. Droits des utilisateurs</h2>
        <p className="mt-4 text-t3 leading-relaxed">
          Tu peux demander la modification ou la suppression de tes données à tout moment en contactant l'équipe LesCracks.
        </p>
      </div>
    </div></div>
  </Layout>;
}
