import { Penguin } from "@/components/Penguin";
import { mascotName } from "@/lib/content";
import { siteContent } from "@/lib/site-content";

/** A friendlier 404 than the default, with the penguin to point the way home. */
export default function NotFound() {
  return (
    <main className="site-root grain flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <Penguin pose="wave" className="w-32" />
      <p className="mt-8 font-display text-7xl font-extrabold tracking-tight text-lime">Out!</p>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
        That shot landed off the court.
      </h1>
      <p className="mt-4 max-w-md text-mist/70">
        {mascotName(siteContent)} looked everywhere, but this page isn&apos;t here. Let&apos;s get you back
        in the game.
      </p>
      <a
        href="/"
        className="mt-10 inline-flex items-center gap-2 rounded-xl bg-lime px-6 py-3 font-semibold text-night transition-transform hover:-translate-y-0.5"
      >
        Back to Sync
      </a>
    </main>
  );
}
