const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const aiAgents = await prisma.$queryRaw`DELETE FROM ai_agents WHERE system_name = 'SALES'`;
    console.log('Deleted SALES ai agents');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
