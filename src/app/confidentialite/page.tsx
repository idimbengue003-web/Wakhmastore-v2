import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Politique de confidentialité - Wakhma Store',
  description: 'Politique de confidentialité et protection des données de Wakhma Store',
}

export default function Confidentialite() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange mb-6">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Politique de confidentialité</h1>

      <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700">
        <section>
          <h2 className="text-lg font-bold text-gray-900">1. Données collectées</h2>
          <p>Wakhma Store collecte les données suivantes lors de votre inscription et utilisation du site : nom, numéro de téléphone, mot de passe (chiffré). Lors de la publication d&apos;annonces, les données saisies (titre, description, photos, numéro WhatsApp, localisation) sont enregistrées. Les données de paiement sont traitées de manière sécurisée et ne sont pas partagées avec des tiers.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">2. Utilisation des données</h2>
          <p>Vos données sont utilisées pour le fonctionnement du service : création et gestion de votre compte, publication d&apos;annonces, mise en relation avec d&apos;autres utilisateurs, traitement des paiements. Nous n&apos;utilisons pas vos données à des fins publicitaires ou commerciales tierces.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">3. Protection des numéros WhatsApp</h2>
          <p>Les numéros WhatsApp des vendeurs sont masqués par défaut. Ils ne sont révélés qu&apos;aux utilisateurs ayant dépensé des points via notre système de révélation. Cette mesure vise à protéger la vie privée des vendeurs et à prévenir le spam.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">4. Sécurité des données</h2>
          <p>Les mots de passe sont chiffrés de manière irréversible (bcrypt). Les communications sont sécurisées par HTTPS. Les sessions sont gérées par des tokens JWT sécurisés. Les paiements sont effectués via Wave et validés manuellement par notre équipe.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">5. Partage des données</h2>
          <p>Vos données personnelles ne sont jamais vendues ou partagées avec des tiers, sauf obligation légale. Seuls les numéros WhatsApp sont partagés avec les utilisateurs ayant acheté une révélation, conformément au fonctionnement du service.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">6. Conservation des données</h2>
          <p>Vos données sont conservées tant que votre compte est actif. Les annonces expirées sont conservées pendant 6 mois puis supprimées. Vous pouvez demander la suppression de votre compte et de vos données à tout moment en nous contactant à contact@wakhmastore.com.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">7. Cookies</h2>
          <p>Le site utilise un cookie de session (wakhma_token) pour maintenir votre connexion. Ce cookie est sécurisé (HttpOnly) et expire au bout de 7 jours. Aucun cookie de tracking ou publicitaire n&apos;est utilisé.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">8. Vos droits</h2>
          <p>Conformément à la loi sénégalaise sur la protection des données, vous disposez d&apos;un droit d&apos;accès, de rectification, de suppression et de portabilité de vos données. Pour exercer ces droits, contactez-nous à contact@wakhmastore.com.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">9. Contact</h2>
          <p>Pour toute question relative à la protection de vos données personnelles, vous pouvez nous écrire à : contact@wakhmastore.com</p>
        </section>
      </div>
    </div>
  )
}
