import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Mentions légales - Wakhma Store',
  description: 'Mentions légales du site Wakhma Store',
}

export default function MentionsLegales() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange mb-6">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Mentions légales</h1>

      <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700">
        <section>
          <h2 className="text-lg font-bold text-gray-900">1. Éditeur du site</h2>
          <p>Wakhma Store est un site de petites annonces dédié aux achats et ventes entre particuliers au Sénégal.</p>
          <p>Email : contact@wakhmastore.com</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">2. Hébergement</h2>
          <p>Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">3. Propriété intellectuelle</h2>
          <p>L&apos;ensemble du contenu de ce site (textes, images, logos, design) est protégé par le droit de la propriété intellectuelle. Toute reproduction, même partielle, est interdite sans autorisation préalable.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">4. Responsabilité</h2>
          <p>Wakhma Store est une plateforme de mise en relation entre acheteurs et vendeurs. Wakhma Store ne saurait être tenu responsable des transactions effectuées entre les utilisateurs, ni de l&apos;exactitude des annonces publiées. Chaque utilisateur reste seul responsable du contenu de ses annonces et de ses actes sur la plateforme.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">5. Paiements</h2>
          <p>Les paiements sur Wakhma Store sont effectués via Wave et validés par notre équipe. Les transactions sont sécurisées et vérifiées manuellement pour garantir la sécurité de chaque utilisateur. Wakhma Store ne conserve aucune donnée bancaire.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">6. Droit applicable</h2>
          <p>Les présentes mentions légales sont régies par le droit sénégalais. Tout litige relatif à l&apos;utilisation du site sera soumis à la compétence des tribunaux de Dakar.</p>
        </section>
      </div>
    </div>
  )
}
