import type { Dictionary } from "@/lib/i18n";

type LegalPageProps = {
  title: string;
  body: string;
  contactEmail?: {
    label: string;
    email: string;
  };
  siteName: Dictionary["common"]["siteName"];
};

export default function LegalPage({
  title,
  body,
  contactEmail,
}: LegalPageProps) {
  const paragraphs = body.split(/\n\n+/);

  return (
    <article className="mx-auto max-w-3xl space-y-6 pb-12">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
        {title}
      </h1>
      <div className="space-y-4 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
        {paragraphs.map((block, index) => {
          const lines = block.split("\n");
          return (
            <p key={index} className="whitespace-pre-wrap">
              {lines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < lines.length - 1 ? <br /> : null}
                </span>
              ))}
            </p>
          );
        })}
      </div>
      {contactEmail ? (
        <p className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="font-medium">{contactEmail.label}: </span>
          <a
            href={`mailto:${contactEmail.email}`}
            className="text-violet-700 hover:underline dark:text-violet-300"
          >
            {contactEmail.email}
          </a>
        </p>
      ) : null}
    </article>
  );
}
