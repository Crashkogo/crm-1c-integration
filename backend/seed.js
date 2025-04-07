const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const roles = [
    { name: 'Admin' },
    { name: 'Consultation' },
    { name: 'ITS' },
    { name: 'Implementation' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: { name: role.name },
    });
  }

  console.log('Roles seeded successfully');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });