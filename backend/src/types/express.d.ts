import type { User as PrismaUser } from '@prisma/client';

declare global {
  namespace Express {
    // Estende Express.User com os campos do Prisma para que req.user tenha o tipo correto
    interface User extends PrismaUser {}
    interface Request {
      user: PrismaUser;
    }
  }
}

export {};
