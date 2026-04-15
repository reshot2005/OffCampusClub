const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.post.count();
  console.log(`Total posts in DB: ${count}`);
  
  if (count > 0) {
    const posts = await prisma.post.findMany({
      take: 5,
      select: { id: true, caption: true, hidden: true, user: { select: { role: true } } }
    });
    console.log('Sample posts:', JSON.stringify(posts, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
