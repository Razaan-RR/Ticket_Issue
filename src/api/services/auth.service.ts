import bcrypt from "bcrypt";

import { sql } from "../../db";
import type { CreateUser, SafeUser, User } from "../../types";

class AuthService {
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  private async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  async createUser(user: CreateUser): Promise<SafeUser | null> {
    const { name, email, password, role } = user;

    const existingUser = await sql`
      SELECT id
      FROM users
      WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return null;
    }

    const passwordHash = await this.hashPassword(password);

    const result = await sql`
      INSERT INTO users (
        name,
        email,
        password_hash,
        role
      )
      VALUES (
        ${name},
        ${email},
        ${passwordHash},
        COALESCE(${role}, 'contributor')
      )

      RETURNING
        id,
        name,
        email,
        role,
        created_at,
        updated_at
    `;

    return result[0] as SafeUser;
  }

  async validateUser(
    email: string,
    password: string
  ): Promise<SafeUser | null> {
    const result = await sql`
      SELECT *
      FROM users
      WHERE email = ${email}
    `;

    if (result.length === 0) {
      return null;
    }

    const user = result[0] as User;

    const isPasswordMatched = await this.comparePassword(
      password,
      user.password_hash
    );

    if (!isPasswordMatched) {
      return null;
    }

    const { password_hash, ...safeUser } = user;

    return safeUser as SafeUser;
  }

  async getUserById(id: number): Promise<SafeUser | null> {
    const result = await sql`
      SELECT
        id,
        name,
        email,
        role,
        created_at,
        updated_at
      FROM users
      WHERE id = ${id}
    `;

    if (result.length === 0) {
      return null;
    }

    return result[0] as SafeUser;
  }
}

export default new AuthService();