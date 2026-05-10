import { Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../src/db";
import "dotenv/config";
import { readFile } from "fs/promises";
import path from "path";

async function main() {
  console.log("Seeding database...");

  // Load seed.json
  const filePath = path.resolve(__dirname, "./seed.json");
  const seedRaw = await readFile(filePath, "utf-8");
  const seed = JSON.parse(seedRaw);

  const adminUsername = seed.admin.username;
  const adminEmail = seed.admin.email;
  const adminPassword = seed.admin.password;

  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ username: adminUsername }, { email: adminEmail }],
    },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        fName: seed.admin.fName,
        lName: seed.admin.lName,
        role: Role.ADMIN,
        active: true,
        permissions: seed.admin.permissions,
      },
    });

    console.log(`Admin user created: ${admin.username}`);
  } else {
    console.log("Admin user already exists.");
  }

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
