import { PrismaClient, JobType } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding...');

  const password = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@chancen.local' },
    update: {},
    create: {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@chancen.local',
      password,
      headline: 'Product Designer at Chancen',
      company: 'Chancen',
      bio: 'Passionate about design and user experience.',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@chancen.local' },
    update: {},
    create: {
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob@chancen.local',
      password,
      headline: 'Full-Stack Engineer',
      company: 'Acme Inc',
      bio: 'Building the future, one commit at a time.',
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: 'carol@chancen.local' },
    update: {},
    create: {
      firstName: 'Carol',
      lastName: 'Lee',
      email: 'carol@chancen.local',
      password,
      headline: 'Marketing Lead',
      company: 'GrowthCo',
      bio: 'Helping brands grow.',
    },
  });

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: alice.id, followingId: bob.id } },
    update: {},
    create: { followerId: alice.id, followingId: bob.id },
  });

  await prisma.post.create({
    data: {
      content: 'Hello Chancen! Excited to be here 🚀',
      userId: alice.id,
    },
  });

  await prisma.post.create({
    data: {
      content: 'Just shipped a new feature. What do you think?',
      userId: bob.id,
    },
  });

  await prisma.job.create({
    data: {
      title: 'Frontend Engineer',
      description: 'Build beautiful UIs with React and Next.js.',
      company: 'Chancen',
      location: 'Remote',
      type: JobType.full_time,
      salary: '$90k - $120k',
      requirements: '3+ years React, TypeScript, Tailwind',
      benefits: 'Health, 401k, flexible hours',
      userId: alice.id,
    },
  });

  await prisma.job.create({
    data: {
      title: 'Backend Engineer',
      description: 'Scale our NestJS + Prisma API.',
      company: 'Acme Inc',
      location: 'Berlin',
      type: JobType.full_time,
      salary: '$100k - $130k',
      userId: bob.id,
    },
  });

  console.log('Seeded:', { alice: alice.email, bob: bob.email, carol: carol.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
