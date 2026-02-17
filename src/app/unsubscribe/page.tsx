import Link from "next/link";

import { unsubscribeAction } from "../subscribe/actions";
import { resolveSiteContext } from "../../lib/sites";

type UnsubscribePageProps = {
  searchParams?: {
    message?: string;
  };
};

export default async function UnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  const { site } = await resolveSiteContext();

  return (
    <main className="page page--medium">
      <h1>Unsubscribe</h1>
      <p className="text-secondary">
        Stop receiving emails from {site?.name ?? "this site"}.
      </p>
      {searchParams?.message ? <p>{searchParams.message}</p> : null}
      <form action={unsubscribeAction} className="form">
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
          Unsubscribe
        </button>
      </form>
      <p className="section">
        Changed your mind? <Link href="/subscribe">Subscribe</Link>
      </p>
    </main>
  );
}
