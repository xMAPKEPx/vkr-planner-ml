import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export interface IUserService {
  register(email: string, password: string, name?: string, role?: string): Promise<any>;
  login(email: string, password: string): Promise<any>;
  getProfile(userId: number): Promise<any>;
  updateSpeedFactor(userId: number, speedFactor: number, accuracy: number): Promise<any>;
}

export class UserService implements IUserService {
  // Валидация роли (Раздел 3.2.1)
  private validateRole(role?: string): Role {
    const validRoles: string[] = ['USER', 'TEAM_LEAD', 'ADMIN'];
    
    if (!role || !validRoles.includes(role)) {
      return Role.USER; // Значение по умолчанию из схемы
    }
    
    return role as Role;
  }

  // Регистрация (Раздел 3.2.1)
  async register(email: string, password: string, name?: string, role?: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('Пользователь уже существует');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Приводим строку к типу Role
    const userRole = this.validateRole(role);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: userRole,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    };
  }

  // Вход
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Неверный email или пароль');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Неверный email или пароль');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    };
  }

  // Получить профиль (Раздел 3.2.1)
  async getProfile(userId: number) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        speedFactor: true,  // Для self-finetuning (Раздел 3.3.1)
        accuracy: true,
        createdAt: true,
      },
    });
  }

  // Обновить коэффициент скорости (Раздел 3.3.1)
  async updateSpeedFactor(userId: number, speedFactor: number, accuracy: number) {
    return await prisma.user.update({
      where: { id: userId },
      data: { speedFactor, accuracy },
    });
  }
}

export const userService = new UserService();