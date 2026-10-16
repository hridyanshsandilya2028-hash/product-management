export interface WhatsAppUpdate {
  phone: string;
  message: string;
}

export interface WhatsAppService {
  sendOptedInUpdate: (update: WhatsAppUpdate) => Promise<void>;
}

const whatsappFunctionUrl = import.meta.env.VITE_WHATSAPP_FUNCTION_URL as string | undefined;

export class MetaWhatsAppCloudService implements WhatsAppService {
  async sendOptedInUpdate(update: WhatsAppUpdate): Promise<void> {
    if (!whatsappFunctionUrl) {
      throw new Error("WhatsApp updates are not configured.");
    }
    const response = await fetch(whatsappFunctionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    if (!response.ok) {
      throw new Error(`WhatsApp update failed with status ${response.status}`);
    }
  }
}

export const whatsappService: WhatsAppService = new MetaWhatsAppCloudService();
