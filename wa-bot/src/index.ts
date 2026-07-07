import { BotInstance } from "@/src/instance";

const ownerId = process.env.OWNER_ID ?? "default";
const instance = new BotInstance(ownerId);

instance.start().catch((err) => {
  console.error(err);
  process.exit(1);
});
