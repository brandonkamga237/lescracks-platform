import BadgeList from '@/components/recognition/BadgeList';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';

/** The member's badges on their account. Nothing shows until they hold one. */
export default function MyBadges() {
  const badges = useApi((signal) => api.myBadges(signal), []);
  if (!badges.data?.length) return null;

  return (
    <section aria-labelledby="badges-heading" className="mt-6">
      <h2 id="badges-heading" className="text-lg text-t1 sm:text-xl">Mes badges</h2>
      <div className="mt-4"><BadgeList badges={badges.data} /></div>
    </section>
  );
}
