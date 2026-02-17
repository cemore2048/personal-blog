import Link from "next/link";

import { subscribeAction } from "./actions";
import { resolveSiteContext } from "../../lib/sites";

type SubscribePageProps = {
  searchParams?: {
    message?: string;
  };
};

export default async function SubscribePage({
  searchParams,
}: SubscribePageProps) {
  const { site } = await resolveSiteContext();

  return (
    <main className="page page--medium">
      <h1>Subscribe</h1>
      <p className="text-secondary">
        Get new posts from {site?.name ?? "this site"}.
      </p>
      {searchParams?.message ? <p>{searchParams.message}</p> : null}
      <form action={subscribeAction} className="form">
        <label className="form-field">
          Email
          <input
            type="email"
            name="email"
            required
          />
        </label>
        <button
          type="submit"
          className="button button-primary"
        >
          Subscribe
        </button>
      </form>
      <p className="section">
        Want to leave? <Link href="/unsubscribe">Unsubscribe</Link>
      </p>
    </main>
  );
}
