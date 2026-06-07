import Link from 'next/link'
import { Store } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center gap-2 font-extrabold text-sm mb-2">
              <div className="w-7 h-7 bg-orange rounded-lg flex items-center justify-center">
                <Store className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white">Wakhma Store</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Les bonnes affaires à Dakar. Poste ce que tu cherches, les vendeurs te le trouvent rapidement.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white text-xs mb-2">Navigation</h4>
            <div className="space-y-1">
              <Link href="/annonces" className="block text-xs text-gray-500 hover:text-orange">Annonces</Link>
              <Link href="/deposer" className="block text-xs text-gray-500 hover:text-orange">Déposer</Link>
              <Link href="/recharge" className="block text-xs text-gray-500 hover:text-orange">Recharger</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white text-xs mb-2">Légal</h4>
            <div className="space-y-1">
              <Link href="/mentions-legales" className="block text-xs text-gray-500 hover:text-orange">Mentions légales</Link>
              <Link href="/cgu" className="block text-xs text-gray-500 hover:text-orange">CGU</Link>
              <Link href="/confidentialite" className="block text-xs text-gray-500 hover:text-orange">Confidentialité</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white text-xs mb-2">Contact</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Dakar, Sénégal<br />
              WhatsApp disponible<br />
              contact@wakhmastore.com
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800 flex justify-between items-center">
          <p className="text-[10px] text-gray-600">
            &copy; {new Date().getFullYear()} Wakhma Store
          </p>
          <div className="flex gap-3">
            <Link href="/mentions-legales" className="text-[10px] text-gray-600 hover:text-orange">Mentions légales</Link>
            <Link href="/cgu" className="text-[10px] text-gray-600 hover:text-orange">CGU</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
