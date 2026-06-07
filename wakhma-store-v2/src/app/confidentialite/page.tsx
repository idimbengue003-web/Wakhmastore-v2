export default function ConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Politique de Confidentialité</h1>
      <div className="prose prose-sm text-gray-600 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Données collectées</h2>
        <p>Nous collectons les données nécessaires au fonctionnement du service : nom, numéro de téléphone, annonces postées, historique de paiements.</p>
        <h2 className="text-lg font-semibold text-gray-900">Utilisation des données</h2>
        <p>Vos données sont utilisées exclusivement pour le fonctionnement de la plateforme : authentification, affichage des annonces, gestion des points et abonnements.</p>
        <h2 className="text-lg font-semibold text-gray-900">Protection des numéros</h2>
        <p>Les numéros WhatsApp sont masqués par défaut et ne sont révélés qu'après paiement de points, afin de protéger la vie privée des utilisateurs.</p>
        <h2 className="text-lg font-semibold text-gray-900">Partage des données</h2>
        <p>Vos données ne sont jamais partagées avec des tiers à des fins commerciales.</p>
        <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
        <p>Pour toute question relative à vos données personnelles, contactez-nous à contact@wakhmastore.com.</p>
      </div>
    </div>
  )
}
