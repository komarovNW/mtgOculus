import { releases } from '@/shared/config/releases';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { PageHeader } from '@/shared/ui/PageHeader';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function ChangelogPage() {
  return (
    <div className="page-stack">
      <PageHeader
        description="История заметных изменений Magic Oculus: новые возможности, улучшения интерфейса и важные исправления."
        eyebrow="Версии приложения"
        title="Что нового"
      />

      <div className="release-list">
        {releases.map((release, index) => (
          <Card
            className="release-card"
            key={release.version}
            tone={index === 0 ? 'accent' : 'default'}
          >
            <article>
              <header className="release-card__header">
                <div>
                  <div className="release-card__meta">
                    <span className="release-card__version">v{release.version}</span>
                    <Badge variant={release.status === 'upcoming' ? 'accent' : 'neutral'}>
                      {release.status === 'upcoming' ? 'Следующий релиз' : 'Выпущено'}
                    </Badge>
                    {release.releasedAt ? (
                      <time dateTime={release.releasedAt}>
                        {dateFormatter.format(new Date(`${release.releasedAt}T00:00:00Z`))}
                      </time>
                    ) : null}
                  </div>
                  <h2 className="release-card__title">{release.title}</h2>
                  <p className="release-card__description">{release.description}</p>
                </div>
              </header>

              <div className="release-card__sections">
                {release.sections.map((section) => (
                  <section
                    className="release-section"
                    key={section.title}
                  >
                    <h3 className="release-section__title">{section.title}</h3>
                    <ul className="flat-list">
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </article>
          </Card>
        ))}
      </div>
    </div>
  );
}
