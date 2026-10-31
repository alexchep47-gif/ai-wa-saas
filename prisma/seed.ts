import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@cmr-school.online";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Seed already applied.");
    return;
  }

  const passwordHash = await bcrypt.hash("demo1234", 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: "Admin CMR SCHOOL",
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: "CMR SCHOOL",
      slug: "cmr-school",
      plan: "trial",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      monthlyMsgLimit: 2000,
    },
  });

  await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      role: "owner",
    },
  });

  await prisma.agent.create({
    data: {
      name: "Agent Mathsfor.all",
      organizationId: org.id,
      systemPrompt:
        "Tu es l'assistant officiel de Mathsfor.all / CMR SCHOOL. Tu aides les élèves et parents en français sur les programmes de Seconde, Première et Terminale (Maths, Physique, Chimie). Tu restes factuel, encourageant et tu proposes de contacter un conseiller humain pour les inscriptions et paiements.",
      quickReplies: JSON.stringify({
        tarifs:
          "Les packs de révision commencent à partir de 5 000 FCFA. Écris !inscription pour plus de détails.",
        inscription:
          "Pour t'inscrire, envoie ton nom, niveau (Seconde/Première/Terminale) et série. Un conseiller te recontactera.",
        contact:
          "Tu peux aussi écrire directement à notre équipe ou appeler le numéro affiché sur cmr-school.online.",
      }),
      status: "draft",
      dailyMsgLimit: 300,
    },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: org.id,
      level: "info",
      message: "Organisation pilote initialisée (seed)",
    },
  });

  console.log("Seed OK");
  console.log("Email :", email);
  console.log("Mot de passe : demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
