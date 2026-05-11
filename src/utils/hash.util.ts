/**
 * @file src/utils/hash.ts
 * @description Password hashing utilities using bcrypt
 * @author Mahros ALQabasy <mahros.dev>
 */

import bcrypt from 'bcrypt';
import { config } from '../config';

export async function hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, config.auth.saltRounds);
}

export async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
}
