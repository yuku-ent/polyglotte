import { PLATFORMS, POLYGLOTTE_PRINCIPLES } from "@/content/platforms";

export const metadata = { title: "La méthode — Polyglotte" };

export default function MethodPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">La méthode</h1>
        <p className="mt-1 max-w-3xl text-stone-600">
          Aucune plateforme ne fait tout bien. Polyglotte reprend ce qui marche dans chacune et corrige leurs points
          faibles, pour que tu travailles les quatre compétences au même endroit : vocabulaire, compréhension, oral et
          écrit.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {POLYGLOTTE_PRINCIPLES.map((p) => (
          <div key={p.title} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold">{p.title}</h2>
            <p className="mt-1 text-sm text-stone-600">{p.text}</p>
          </div>
        ))}
      </section>

      <h2 className="mt-10 text-xl font-bold">Ce qu&apos;on garde, ce qu&apos;on corrige</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th scope="col" className="px-4 py-3">Plateforme</th>
              <th scope="col" className="px-4 py-3">Points forts</th>
              <th scope="col" className="px-4 py-3">Points faibles</th>
              <th scope="col" className="px-4 py-3">Dans Polyglotte</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 align-top">
            {PLATFORMS.map((p) => (
              <tr key={p.name}>
                <th scope="row" className="px-4 py-4">
                  <span className="block font-semibold text-stone-900">{p.name}</span>
                  <span className="text-xs font-normal text-stone-500">{p.kind}</span>
                </th>
                <td className="px-4 py-4">
                  <ul className="space-y-1">
                    {p.strengths.map((s) => (
                      <li key={s} className="text-emerald-800">+ {s}</li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-4">
                  <ul className="space-y-1">
                    {p.weaknesses.map((w) => (
                      <li key={w} className="text-red-700">− {w}</li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-4 text-stone-700">{p.inPolyglotte}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-10 rounded-2xl bg-stone-900 p-6 text-stone-100">
        <h2 className="text-lg font-bold">Une routine de 20 minutes par jour</h2>
        <ol className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
          <li><strong className="block text-white">1. Réviser · 5 min</strong>Les cartes du jour, à voix haute.</li>
          <li><strong className="block text-white">2. Lire & écouter · 5 min</strong>Une histoire courte, puis le quiz.</li>
          <li><strong className="block text-white">3. Parler · 5 min</strong>Cinq échanges avec le tuteur.</li>
          <li><strong className="block text-white">4. Écrire · 5 min</strong>Quelques phrases dans ton journal.</li>
        </ol>
        <p className="mt-4 text-sm text-stone-400">
          Le tuteur IA ne remplace pas complètement un humain : une séance par semaine avec un vrai natif (italki,
          Preply) reste un excellent complément.
        </p>
      </section>
    </div>
  );
}
