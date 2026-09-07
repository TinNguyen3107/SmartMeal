import 'dotenv/config';
import fs from 'fs';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.ts';

function adapterOptionsFromUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const database = url.pathname.replace(/^\//, '');
  const sslRequested = url.hostname.includes('tidbcloud.com')
    || url.searchParams.has('ssl')
    || url.searchParams.has('sslaccept')
    || process.env.DATABASE_SSL === 'true';
  const caPath = process.env.DATABASE_CA_PATH;
  const ssl = sslRequested
    ? caPath && fs.existsSync(caPath)
      ? { ca: fs.readFileSync(caPath, 'utf8') }
      : true
    : undefined;

  return {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    ...(ssl ? { ssl } : {})
  };
}

const connectionUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_PRISMA;

if (!connectionUrl) {
  throw new Error('Missing DATABASE_URL or DATABASE_URL_PRISMA in environment.');
}

const adapter = new PrismaMariaDb(adapterOptionsFromUrl(connectionUrl) as any);

export const prisma = new PrismaClient({ adapter });
