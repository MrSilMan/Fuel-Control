import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword    = await bcrypt.hash("admin123", 12);
  const operatorPassword = await bcrypt.hash("operator123", 12);

  // ── Users ────────────────────────────────────────────────────────────────────
  // Admin logs in with email + password
  await prisma.user.upsert({
    where: { email: "admin@fuelcontrol.com" },
    update: { password: adminPassword, name: "Administrador" },
    create: {
      email: "admin@fuelcontrol.com",
      password: adminPassword,
      name: "Administrador",
      role: "ADMIN",
    },
  });

  // Operators log in with mecNumber + password. One user per driver.
  const operatorDrivers = [
    { mecNumber: "200120",  name: "João Silva"      },
    { mecNumber: "19851",   name: "Maria Santos"    },
    { mecNumber: "19908",   name: "Carlos Ferreira" },
    { mecNumber: "20090111",name: "Ana Costa"       },
    { mecNumber: "2001009", name: "Pedro Oliveira"  },
  ];

  for (const op of operatorDrivers) {
    await prisma.user.upsert({
      where: { mecNumber: op.mecNumber },
      update: { password: operatorPassword, name: op.name },
      create: {
        mecNumber: op.mecNumber,
        password: operatorPassword,
        name: op.name,
        role: "OPERATOR",
      },
    });
  }

  // ── Vehicles ─────────────────────────────────────────────────────────────────
  const vehicles = await Promise.all([
    prisma.vehicle.upsert({
      where: { matricula: "LD-88-12-BB" },
      update: {},
      create: { matricula: "LD-88-12-BB", tipo: "SUV" },
    }),
    prisma.vehicle.upsert({
      where: { matricula: "LD-52-34-DD" },
      update: {},
      create: { matricula: "LD-52-34-DD", tipo: "Coaster" },
    }),
    prisma.vehicle.upsert({
      where: { matricula: "LD-50-78-HI" },
      update: {},
      create: { matricula: "LD-50-78-HI", tipo: "HIACE" },
    }),
    prisma.vehicle.upsert({
      where: { matricula: "LD-71-56-FF" },
      update: {},
      create: { matricula: "LD-71-56-FF", tipo: "Foton" },
    }),
    prisma.vehicle.upsert({
      where: { matricula: "LD-38-91-HY" },
      update: {},
      create: { matricula: "LD-38-91-HY", tipo: "Pickup" },
    }),
  ]);

  // ── Drivers ──────────────────────────────────────────────────────────────────
  const drivers = await Promise.all([
    prisma.driver.upsert({
      where: { nMec: "200120" },
      update: {},
      create: { nome: "João Silva",      nMec: "200120",   area: "DAS"    },
    }),
    prisma.driver.upsert({
      where: { nMec: "19851" },
      update: {},
      create: { nome: "Maria Santos",    nMec: "19851",    area: "Eurost" },
    }),
    prisma.driver.upsert({
      where: { nMec: "19908" },
      update: {},
      create: { nome: "Carlos Ferreira", nMec: "19908",    area: "DMC"    },
    }),
    prisma.driver.upsert({
      where: { nMec: "20090111" },
      update: {},
      create: { nome: "Ana Costa",       nMec: "20090111", area: "DAS"    },
    }),
    prisma.driver.upsert({
      where: { nMec: "2001009" },
      update: {},
      create: { nome: "Pedro Oliveira",  nMec: "2001009",  area: "Eurost" },
    }),
  ]);

  // ── FuelLogs ─────────────────────────────────────────────────────────────────
  // Only seed logs when the table is empty to avoid duplicates on re-runs.
  const logCount = await prisma.fuelLog.count();
  if (logCount === 0) {
    const now = new Date();
    const day = (offset: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - offset);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const logsData = [
      { vehicleId: vehicles[0].id, driverId: drivers[0].id, gasolina: 40.5,  gasoleo: null,  data: day(14), hora: "08:30", observacao: "Abastecimento normal"   },
      { vehicleId: vehicles[1].id, driverId: drivers[1].id, gasolina: null,   gasoleo: 55.0,  data: day(13), hora: "09:15", observacao: null                     },
      { vehicleId: vehicles[2].id, driverId: drivers[2].id, gasolina: null,   gasoleo: 30.0,  data: day(12), hora: "10:00", observacao: "Viagem longa"           },
      { vehicleId: vehicles[3].id, driverId: drivers[3].id, gasolina: 25.0,   gasoleo: null,  data: day(11), hora: "07:45", observacao: null                     },
      { vehicleId: vehicles[4].id, driverId: drivers[4].id, gasolina: null,   gasoleo: 45.5,  data: day(10), hora: "11:30", observacao: "Missão especial"        },
      { vehicleId: vehicles[0].id, driverId: drivers[1].id, gasolina: 35.0,   gasoleo: null,  data: day(9),  hora: "08:00", observacao: null                     },
      { vehicleId: vehicles[1].id, driverId: drivers[2].id, gasolina: null,   gasoleo: 60.0,  data: day(8),  hora: "14:20", observacao: "Abastecimento completo" },
      { vehicleId: vehicles[2].id, driverId: drivers[0].id, gasolina: 20.0,   gasoleo: null,  data: day(7),  hora: "09:00", observacao: null                     },
      { vehicleId: vehicles[3].id, driverId: drivers[4].id, gasolina: null,   gasoleo: 50.0,  data: day(6),  hora: "15:45", observacao: "Urgente"                },
      { vehicleId: vehicles[4].id, driverId: drivers[3].id, gasolina: 45.0,   gasoleo: null,  data: day(5),  hora: "10:30", observacao: "Veículo cheio"          },
    ];

    for (const log of logsData) {
      await prisma.fuelLog.create({ data: log });
    }
  }

  console.log("✅ Seed concluído com sucesso!");
  console.log("   Admin:    admin@fuelcontrol.com / admin123");
  console.log("   Operadores (password: operator123):");
  console.log("     200120   — João Silva");
  console.log("     19851    — Maria Santos");
  console.log("     19908    — Carlos Ferreira");
  console.log("     20090111 — Ana Costa");
  console.log("     2001009  — Pedro Oliveira");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
