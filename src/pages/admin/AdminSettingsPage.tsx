import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getContactSettings, updateContactSettings, type ContactSettingsResponse } from "@/lib/api";

const defaultSettings: ContactSettingsResponse = {
  address: "",
  phone: "",
  hours: "",
  map_embed_url: "",
  instagram_url: "",
  facebook_url: "",
  twitter_url: "",
};

const AdminSettingsPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<ContactSettingsResponse>(defaultSettings);

  const { data } = useQuery({ queryKey: ["admin", "contact-settings"], queryFn: getContactSettings });

  useEffect(() => {
    if (!data) return;
    setForm({ ...defaultSettings, ...data });
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: updateContactSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "contact-settings"] });
      queryClient.invalidateQueries({ queryKey: ["contact-settings"] });
      toast({ title: "Settings saved" });
    },
    onError: (error) => {
      toast({ title: "Could not save settings", description: error instanceof Error ? error.message : "Try again", variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Business settings</CardTitle>
        <CardDescription>Manage contact and social links displayed on the website.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="settings-address">Address</Label>
          <Input
            id="settings-address"
            value={form.address ?? ""}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="settings-phone">Phone</Label>
            <Input
              id="settings-phone"
              value={form.phone ?? ""}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-hours">Opening hours</Label>
            <Input
              id="settings-hours"
              value={form.hours ?? ""}
              onChange={(event) => setForm((prev) => ({ ...prev, hours: event.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-map">Map embed URL</Label>
          <Input
            id="settings-map"
            value={form.map_embed_url ?? ""}
            onChange={(event) => setForm((prev) => ({ ...prev, map_embed_url: event.target.value }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="settings-instagram">Instagram</Label>
            <Input
              id="settings-instagram"
              value={form.instagram_url ?? ""}
              onChange={(event) => setForm((prev) => ({ ...prev, instagram_url: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-facebook">Facebook</Label>
            <Input
              id="settings-facebook"
              value={form.facebook_url ?? ""}
              onChange={(event) => setForm((prev) => ({ ...prev, facebook_url: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-twitter">Twitter</Label>
            <Input
              id="settings-twitter"
              value={form.twitter_url ?? ""}
              onChange={(event) => setForm((prev) => ({ ...prev, twitter_url: event.target.value }))}
            />
          </div>
        </div>

        <Button type="button" onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
          <Save className="h-4 w-4" />
          Save settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminSettingsPage;
