import { SiteHeader } from '@/components/landing/site-header'
import { SiteFooter } from '@/components/landing/site-footer'
import { Hero } from '@/components/landing/hero'
import { Problem } from '@/components/landing/problem'
import { Solution } from '@/components/landing/solution'
import { Effect } from '@/components/landing/effect'
import { Cdss } from '@/components/landing/cdss'
import { Cta } from '@/components/landing/cta'

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Problem />
        <Solution />
        <Effect />
        <Cdss />
        <Cta />
      </main>
      <SiteFooter />
    </div>
  )
}
