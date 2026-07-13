try {
  const fs = require("fs");
  const path = require("path");
  const envLocalPath = path.resolve(process.cwd(), ".env.local");
  
  if (fs.existsSync(envLocalPath)) {
    require("dotenv").config({ path: envLocalPath });
  } else {
    require("dotenv").config();
  }
} catch (e) {
  // dotenv is a devDependency; ignore if missing in production container
}

module.exports = {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
