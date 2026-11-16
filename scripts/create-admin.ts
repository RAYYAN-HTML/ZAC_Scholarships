import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';
import { hashPassword } from '../src/lib/server/password';

const email = process.argv[2]?.trim().toLowerCase(); const name = process.argv[3]?.trim();
if (!email || !name) { console.error('Usage: pnpm admin:create admin@example.com "Admin Name"'); process.exit(1); }
const password = process.env.ADMIN_INITIAL_PASSWORD;
if (!password || password.length < 14) { console.error('Set ADMIN_INITIAL_PASSWORD to a unique password with at least 14 characters in your shell environment.'); process.exit(1); }
const url = process.env.DATABASE_URL; if (!url) { console.error('Set DATABASE_URL before creating an admin.'); process.exit(1); }
const pool = mysql.createPool(url);
try { const passwordHash = await hashPassword(password); await pool.execute('INSERT INTO admins (id,email,password_hash,name,role,active) VALUES (?,?,?,?,?,?)',[randomUUID(),email,passwordHash,name,'admin',true]); console.log(`Admin created for ${email}. Keep the password private and clear ADMIN_INITIAL_PASSWORD from your shell.`); } catch (error) { console.error('Could not create admin. Confirm migrations are applied and the email is not already registered.',error); process.exitCode=1; } finally { await pool.end(); }
