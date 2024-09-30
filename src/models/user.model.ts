// src/models/UserModel.ts
import db from "../database/db";
import { Password, hash } from "bun";

export interface User {
  user_id?: number;
  username: string;
  email: string;
  password_hash: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

class UserModel {
  static async createUser(
    username: string,
    email: string,
    password: string
  ): Promise<User> {
    const password_hash = await hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
      [username, email, password_hash]
    );
    return result.rows[0];
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const result = await db.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);
    return result.rows[0] || null;
  }

  static async getUserById(user_id: number): Promise<User | null> {
    const result = await db.query(`SELECT * FROM users WHERE user_id = $1`, [
      user_id,
    ]);
    return result.rows[0] || null;
  }

  static async updateUser(
    user_id: number,
    updates: Partial<User>
  ): Promise<User> {
    const { username, email, password_hash, updated_at } = updates;
    const result = await db.query(
      `UPDATE users 
             SET username = COALESCE($1, username), 
                 email = COALESCE($2, email), 
                 password_hash = COALESCE($3, password_hash), 
                 updated_at = $4 
             WHERE user_id = $5 
             RETURNING *`,
      [username, email, password_hash, updated_at || new Date(), user_id]
    );
    return result.rows[0];
  }

  static async deleteUser(user_id: number): Promise<void> {
    await db.query(`UPDATE users SET deleted_at = $1 WHERE user_id = $2`, [
      new Date(),
      user_id,
    ]);
  }
}

export default UserModel;
