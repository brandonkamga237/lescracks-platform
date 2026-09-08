import Layout from '@/components/layout/Layout';
import SEO from '@/components/common/SEO';

export default function Privacy() {
  return <Layout>
    <SEO title="Politique de confidentialité" description="Comment LesCracks protège et utilise tes données personnelles." url="/politique-confidentialite" />
    <div className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-t1 sm:text-4xl">Politique de confidentialité</h1>
      <p className="mt-6 text-t3 leading-relaxed">
        LesCracks respecte ta vie privée. Cette politique explique quelles données sont collectées, comment elles sont utilisées et comment elles sont protégées.
      </p>
      <h2 className="mt-10 font-display text-xl font-semibold text-t1">1. Données collectées</h2>
      <p className="mt-4 text-t3 leading-relaxed">
        Lors de l'inscription, nous collectons ton nom, ton adresse email et les informations de connexion. Ces données sont nécessaires au fonctionnement du service.
      </p>
      <h2 className="mt-10 font-display text-xl font-semibold text-t1">2. Utilisation des données</h2>
      <p className="mt-4 text-t3 leading-relaxed">
        Les données servent à gérer ton compte, à te donner accès aux contenus et, si tu y consens, à t'envoyer la newsletter.
      </p>
      <h2 className="mt-10 font-display text-xl font-semibold text-t1">3. Partage et sécurité</h2>
      <p className="mt-4 text-t3 leading-relaxed">
        Les données ne sont pas revendues. L'accès aux informations est sécurisé et limité aux seules finalités du service.
      </p>
      <h2 className="mt-10 font-display text-xl font-semibold text-t1">4. Droits des utilisateurs</h2>
      <p className="mt-4 text-t3 leading-relaxed">
        Tu peux demander la modification ou la suppression de tes données à tout moment en contactant l'équipe LesCracks.
      </p>
    </div>
  </Layout>;
}
