import '../src/config/load-env';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { hash } from 'argon2';

import { PrismaClient } from '../src/generated/prisma/client';

const TEAMS = [
  { name: 'Не дзвони мені Саул', icon: '📞', color: '#ff6b6b', order: 1 },
  { name: 'Апостоли Джедаї', icon: '⚔️', color: '#4d96ff', order: 2 },
  { name: 'Маверік', icon: '✈️', color: '#ffcb3d', order: 3 },
  { name: 'Розвалюхи', icon: '🔧', color: '#6bcb77', order: 4 },
  { name: 'Ковчегополіс', icon: '🚢', color: '#b06bf0', order: 5 },
  { name: 'Яблучі', icon: '🍎', color: '#00c2a8', order: 6 },
  { name: 'Зелені бусинки', icon: '📿', color: '#ff9f45', order: 7 },
];

const DAYS = [
  { label: 'День 0', order: 0 },
  { label: 'День W', order: 1 },
  { label: 'День P', order: 2 },
  { label: 'День E', order: 3 },
  { label: 'День R', order: 4 },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    for (const team of TEAMS) {
      await prisma.team.upsert({
        where: { name: team.name },
        update: { icon: team.icon, color: team.color, order: team.order },
        create: team,
      });
    }
    console.log(`✓ seeded ${TEAMS.length} teams`);

    for (const day of DAYS) {
      await prisma.day.upsert({
        where: { order: day.order },
        update: { label: day.label },
        create: day,
      });
    }
    console.log(`✓ seeded ${DAYS.length} days`);

    const nickname = process.env.SEED_ADMIN_NICKNAME || 'admin';
    const password = await hash(process.env.SEED_ADMIN_PASSWORD || 'admin12345');
    await prisma.user.upsert({
      where: { nickname },
      update: {},
      create: { nickname, password, role: 'ADMIN' },
    });
    console.log(`✓ seeded admin user "${nickname}"`);

    await prisma.appState.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton', displayMode: 'LOBBY' },
    });
    console.log('✓ initialised app state');

    await prisma.$disconnect();
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
