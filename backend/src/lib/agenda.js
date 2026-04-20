import Agenda from "agenda";
import { ENV } from "./env.js";
import { connectDB } from "./db.js";
import User from "../models/User.js";
import { deleteStreamUser, upsertStreamUser } from "./stream.js";

// Initialize Agenda
export const agenda = new Agenda({ db: { address: ENV.DB_URL } });

agenda.define("sync-user", async (job) => {
  const { event } = job.attrs.data;
  
  await connectDB();

  const { id, email_addresses, first_name, last_name, image_url } = event.data;

  const newUser = {
    clerkId: id,
    email: email_addresses[0]?.email_address,
    name: `${first_name || ""} ${last_name || ""}`,
    profileImage: image_url,
  };

  await User.create(newUser);

  await upsertStreamUser({
    id: newUser.clerkId.toString(),
    name: newUser.name,
    image: newUser.profileImage,
  });
});

agenda.define("delete-user-from-db", async (job) => {
  const { event } = job.attrs.data;

  await connectDB();

  const { id } = event.data;
  await User.deleteOne({ clerkId: id });

  await deleteStreamUser(id.toString());
});
