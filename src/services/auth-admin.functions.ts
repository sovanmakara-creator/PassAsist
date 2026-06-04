import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ConfirmUserSchema = z.object({
  email: z.string(),
});

export const confirmUserOnServer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ConfirmUserSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const email = data.email;
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw listError;

      const user = users.find((u) => u.email === email);
      if (!user) {
        return { success: false, message: "User not found" };
      }

      if (!user.email_confirmed_at) {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
          email_confirm: true,
        });
        if (updateError) throw updateError;
        return { success: true, message: `Successfully confirmed ${email}` };
      }

      return { success: true, message: "User already confirmed" };
    } catch (err: any) {
      console.error("[confirmUserOnServer Error]:", err.message);
      return { success: false, message: err.message };
    }
  });
