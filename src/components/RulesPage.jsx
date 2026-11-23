/**
 * RulesPage - Community rules and guidelines page
 */
export default function RulesPage() {
  const rules = [
    {
      id: 1,
      title: 'Respectful Communication',
      content: 'All members are expected to communicate respectfully. No harassment, hate speech, or discriminatory language will be tolerated.'
    },
    {
      id: 2,
      title: 'Relevant Content',
      content: 'Posts should be relevant to the NAOS community and University of Ilurin students. Spam and unrelated promotions will be removed.'
    },
    {
      id: 3,
      title: 'No Misinformation',
      content: 'Do not spread false information or rumors. Share only verified facts and sources.'
    },
    {
      id: 4,
      title: 'Privacy Protection',
      content: 'Do not share personal information of other members without consent. Respect everyone\'s privacy.'
    },
    {
      id: 5,
      title: 'Post Moderation',
      content: 'Executive members (PRO I, PRO II, President) have the authority to moderate posts and remove content that violates these rules.'
    },
    {
      id: 6,
      title: 'Constructive Feedback',
      content: 'Feedback and suggestions are welcome. Use the appropriate channels to voice concerns about the community.'
    },
  ];

  return (
    <div className="py-10 bg-naos-gray/30 min-h-[calc(100vh-16rem)]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-naos-dark mb-6">
          Community Rules & Guidelines
        </h1>

        <div className="space-y-6">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="rounded-lg border border-naos-gray/30 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-bold text-naos-dark mb-3">
                {rule.title}
              </h2>
              <p className="text-naos-text leading-relaxed">{rule.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}