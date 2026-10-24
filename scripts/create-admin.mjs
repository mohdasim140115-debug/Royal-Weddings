// Usage: npm run admin:create -- <email> <password> [name]
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";

const [email, password, ...nameParts] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: npm run admin:create -- <email> <password> [name]");
  process.exit(1);
}
if (password.length < 10) {
  console.error("Password must be at least 10 characters.");
  process.exit(1);
}
const prisma = new PrismaClient();
const user = await prisma.user.upsert({
  where: { email: email.toLowerCase() },
  update: { role: "ADMIN", isActive: true, passwordHash: hashPassword(password) },
  create: { email: email.toLowerCase(), name: nameParts.join(" ") || "Administrator", role: "ADMIN", passwordHash: hashPassword(password) },
});
console.log(`Admin ready: ${user.email}`);
await prisma.$disconnect();
