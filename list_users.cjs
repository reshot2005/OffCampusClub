require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- USER AUDIT ---');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      approvalStatus: true,
      suspended: true
    },
    take: 50
  });

  if (users.length === 0) {
    console.log('No users found in database.');
  } else {
    users.forEach(u => {
      console.log(`[${u.approvalStatus}] ${u.fullName} (${u.email}) | Suspended: ${u.suspended}`);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
