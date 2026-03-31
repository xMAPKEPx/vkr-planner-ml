import { Request, Response } from 'express';
import { userService } from '../services/user.service';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    const result = await userService.register(email, password, name, role);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await userService.login(email, password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await userService.getProfile(userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения профиля' });
  }
};