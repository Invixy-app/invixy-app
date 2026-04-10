const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.business.findMany().then(console.dir).finally(() => prisma.$disconnect());
