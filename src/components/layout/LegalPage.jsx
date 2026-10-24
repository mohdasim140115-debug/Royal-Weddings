import PageHeader from "@/components/ui/PageHeader";
import Notice from "@/components/ui/Notice";
import { site } from "@/config/site";

/**
 * Shared layout for policy pages. Policy text is a TEMPLATE: bracketed
 * values must be completed and the whole text reviewed by a qualified
 * professional before launch.
 */
export default function LegalPage({ title, crumb, children }) {
  return (
    <>
      <PageHeader eyebrow="Policies" title={title} crumbs={[{ label: crumb }]} />
      <section className="container-x py-16 lg:py-20">
        <div className="max-w-3xl">
          <Notice tone="warning" title="Template — not yet reviewed">
            This policy is a draft template. Items in [brackets] must be completed and the text reviewed by a qualified professional before {site.name} accepts live bookings.
          </Notice>
          <p className="mt-6 text-sm text-stone">Last updated: {site.legal.policiesLastUpdated || "[date]"}</p>
          <div className="prose-legal mt-6">{children}</div>
        </div>
      </section>
    </>
  );
}

export const entity = () => site.legal.entityName || "[Registered business name]";
