import { lt } from 'drizzle-orm';
import { app } from './app.js';
import { env } from './config/env.js';
import { db } from './db/pool.js';
import { revokedTokens } from './db/schema.js';

app.listen(env.PORT, () => console.log(`Server running on port ${env.PORT}`));

// expired revoked token ghonta-y ekbar clean (table barte dey na)
setInterval(() => {
  db.delete(revokedTokens).where(lt(revokedTokens.expiresAt, new Date())).catch(console.error);
}, 60 * 60 * 1000).unref();