import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface DepositSettings {
  enabled: boolean;
  amount: number;
}

export interface ReminderSettings {
  enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  minutes_before: number;
}

export function useClinicSettings() {
  const queryClient = useQueryClient();

  const { data: depositSettings, isLoading: depositLoading } = useQuery({
    queryKey: ["clinic-settings", "consultation_deposit"],
    queryFn: async (): Promise<DepositSettings> => {
      const { data, error } = await supabase
        .from("clinic_settings")
        .select("setting_value")
        .eq("setting_key", "consultation_deposit")
        .single();

      if (error) {
        console.error("Error fetching deposit settings:", error);
        return { enabled: false, amount: 100 };
      }
      return data?.setting_value as unknown as DepositSettings;
    },
  });

  const { data: reminderSettings, isLoading: reminderLoading } = useQuery({
    queryKey: ["clinic-settings", "reminder_settings"],
    queryFn: async (): Promise<ReminderSettings> => {
      const { data, error } = await supabase
        .from("clinic_settings")
        .select("setting_value")
        .eq("setting_key", "reminder_settings")
        .single();

      if (error) {
        console.error("Error fetching reminder settings:", error);
        return { enabled: true, sms_enabled: true, whatsapp_enabled: false, minutes_before: 60 };
      }
      return data?.setting_value as unknown as ReminderSettings;
    },
  });

  const updateDepositSettings = useMutation({
    mutationFn: async (settings: DepositSettings) => {
      const { error } = await supabase
        .from("clinic_settings")
        .update({ setting_value: settings as unknown as Json })
        .eq("setting_key", "consultation_deposit");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-settings", "consultation_deposit"] });
    },
  });

  const updateReminderSettings = useMutation({
    mutationFn: async (settings: ReminderSettings) => {
      const { error } = await supabase
        .from("clinic_settings")
        .update({ setting_value: settings as unknown as Json })
        .eq("setting_key", "reminder_settings");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-settings", "reminder_settings"] });
    },
  });

  return {
    depositSettings: depositSettings || { enabled: false, amount: 100 },
    reminderSettings: reminderSettings || { enabled: true, sms_enabled: true, whatsapp_enabled: false, minutes_before: 60 },
    isLoading: depositLoading || reminderLoading,
    updateDepositSettings,
    updateReminderSettings,
  };
}
