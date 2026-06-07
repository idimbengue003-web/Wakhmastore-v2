import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'CGU - Wakhma Store',
  description: 'Conditions générales d\'utilisation de Wakhma Store',
}

export default function CGU() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange mb-6">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Conditions Générales d&apos;Utilisation</h1>

      <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700">
        <section>
          <h2 className="text-lg font-bold text-gray-900">1. Objet</h2>
          <p>Les présentes CGU régissent l&apos;utilisation du site Wakhma Store, plateforme de petites annonces dédiée aux achats et ventes entre particuliers au Sénégal. En utilisant le site, vous acceptez ces conditions sans réserve.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">2. Inscription</h2>
          <p>L&apos;inscription est ouverte à toute personne physique majeure résidant au Sénégal. L&apos;utilisateur s&apos;engage à fournir des informations exactes lors de son inscription et à les mettre à jour en cas de changement. L&apos;utilisation d&apos;un faux numéro de téléphone entraînera la suspension du compte.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">3. Annonces</h2>
          <p>Les utilisateurs peuvent publier des annonces pour rechercher ou vendre des biens et services. Toute annonce doit être conforme à la loi sénégalaise. Sont interdits : les contenus illicites, trompeurs, discriminatoires, ou portant atteinte aux droits d&apos;un tiers. Wakhma Store se réserve le droit de supprimer toute annonce non conforme sans préavis.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">4. Système de points et abonnements</h2>
          <p>Wakhma Store propose un système de points permettant de révéler les numéros WhatsApp des vendeurs. Les points sont achetés via Wave et validés par notre équipe via WhatsApp. Les abonnements Diambar et VIP KING donnent accès à des avantages pendant une durée de 30 jours. À l&apos;expiration, l&apos;abonnement est résilié automatiquement sans renouvellement.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">5. Paiements et remboursements</h2>
          <p>Les paiements sont effectués via Wave et validés par notre équipe. Les achats de points et abonnements sont définitifs et ne donnent pas lieu à remboursement, sauf en cas de dysfonctionnement technique prouvé. En cas de problème, contactez-nous à contact@wakhmastore.com.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">6. Comportement des utilisateurs</h2>
          <p>Les utilisateurs s&apos;engagent à utiliser le site de manière loyale et respectueuse. Sont interdits : le spam, la fraude, l&apos;usurpation d&apos;identité, le harcèlement, et toute tentative de contourner le système de paiement. Tout manquement peut entraîner la suspension définitive du compte.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">7. Suspension et résiliation</h2>
          <p>Wakhma Store se réserve le droit de suspendre ou supprimer tout compte ne respectant pas les CGU, sans préavis ni indemnité. L&apos;utilisateur peut supprimer son compte à tout moment en nous contactant.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">8. Modification des CGU</h2>
          <p>Wakhma Store se réserve le droit de modifier les présentes CGU à tout moment. Les modifications prennent effet dès leur publication sur le site. L&apos;utilisation continue du site vaut acceptation des nouvelles conditions.</p>
        </section>
      </div>
    </div>
  )
}
